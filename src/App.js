import { useState } from "react";
import "./styles.css";

export default function App() {
  const [tally, setTally] = useState([]);
  const [error, setError] = useState(undefined);
  const [closeCode, setCloseCode] = useState(undefined);
  const ws = new WebSocket("ws://localhost:8080");

  ws.onmessage = (receivedTally) => {
    setTally(receivedTally);
    setError(undefined);
  };

  ws.onerror = () => {
    setError("Invalid country");
  };

  ws.onclose = (ev) => {
    setCloseCode(ev.code);
  };

  const submitEvent = (medal) => {
    const country = document.getElementByName("country").value;

    if (!country) {
      return;
    }

    ws.send({
      country,
      medal
    });
  };
  return (
    <div>
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
            <button name="gold" onClick={() => submitEvent("gold")}>
              Gold
            </button>
            <button name="silver" onClick={() => submitEvent("silver")}>
              Silver
            </button>
            <button name="bronze" onClick={() => submitEvent("bronze")}>
              Bronze
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
