import "./Popup.css";
import icon from "../../public/icon/128.png";
import OnlineStatus from "../components/OnlineStatus";

export default function Popup() {
  return (
    <div>
      <img
        src={icon}
        alt="Omniroll Icon"
        style={{ width: "64px", height: "64px", marginBottom: "10px" }}
      />{" "}
      <h1>Welcome to Omniroll Ω !</h1>
      <p>
        <OnlineStatus />
      </p>
    </div>
  );
}
