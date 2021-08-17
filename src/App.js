import { useEffect, useState } from "react";
import { split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import {
  ApolloClient,
  ApolloProvider,
  gql,
  InMemoryCache,
  useSubscription,
} from "@apollo/client";
import "./index.css";

const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: {
    reconnect: true,
  },
});

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});

const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link,
});

const TALLY_SUB = gql`
  subscription onTallyUpdated {
    tallyUpdated {
      country
      gold
      silver
      bronze
    }
  }
`;

export default function Container() {
  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
}

function App() {
  const [tally, setTally] = useState([]);
  const [error, setError] = useState(undefined);
  const [closeCode, setCloseCode] = useState(undefined);
  const [opened, setOpened] = useState(false);
  const [ws, setWs] = useState(undefined);
  const { data } = useSubscription(TALLY_SUB);

  console.log(data);

  useEffect(() => {
    if (!ws) {
      setWs(new WebSocket("ws://localhost:8080?auth=invalid"));
    }
  }, []);

  if (ws) {
    ws.onopen = () => {
      setOpened(true);
    };

    ws.onmessage = (e) => {
      setTally(JSON.parse(e.data));
      setError(undefined);
    };

    ws.onerror = () => {
      setError("Invalid country");
    };

    ws.onclose = (ev) => {
      setCloseCode(ev.code);
    };
  }

  const submitEvent = (medal) => {
    const country = document.getElementsByName("country")[0].value;

    if (!country) {
      return;
    }

    ws.send(
      JSON.stringify({
        country,
        medal,
      })
    );
  };

  return (
    <div>
      {opened && !closeCode && (
        <div className="success">WebSocket connection established!</div>
      )}
      <h1>Olympic Medal Tally</h1>
      <table>
        <thead>
          <tr>
            <td>Country</td>
            <td>Gold</td>
            <td>Silver</td>
            <td>Bronze</td>
          </tr>
        </thead>
        <tbody>
          {tally.map((standing) => (
            <tr key={standing.country}>
              <td>{standing.country}</td>
              <td>{standing.gold}</td>
              <td>{standing.silver}</td>
              <td>{standing.bronze}</td>
            </tr>
          ))}
          {tally.length === 0 && (
            <tr>
              <td colSpan={3}>No countries</td>
            </tr>
          )}
        </tbody>
      </table>
      <section>
        {closeCode ? (
          <div className="success">
            Form closed with code {closeCode}. What does this code mean?
          </div>
        ) : (
          <form>
            {error && <div className="error">{error}</div>}
            <label for="country">Country</label>
            <input name="country" placeholder="eg. Australia" />
            <button
              type="button"
              name="gold"
              onClick={() => submitEvent("gold")}
            >
              Gold
            </button>
            <button
              type="button"
              name="silver"
              onClick={() => submitEvent("silver")}
            >
              Silver
            </button>
            <button
              type="button"
              name="bronze"
              onClick={() => submitEvent("bronze")}
            >
              Bronze
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
