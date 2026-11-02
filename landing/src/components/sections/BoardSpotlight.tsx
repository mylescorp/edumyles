import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

type BoardSpotlightProps = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  href: string;
  linkLabel: string;
  kind: "gradebook" | "payments" | "dashboard" | "secondary" | "international";
};

function Illustration({ kind }: { kind: BoardSpotlightProps["kind"] }) {
  if (kind === "dashboard") {
    return (
      <div className="board-illustration board-dashboard" aria-label="Illustration of a school dashboard" role="img">
        <div className="board-window"><span /><span /><span /></div>
        <div className="board-dashboard-body">
          <aside><b>EM</b>{["Overview", "Students", "Academics", "Finance", "Messages"].map((item) => <i key={item}>{item}</i>)}</aside>
          <div className="board-dashboard-main"><strong>School dashboard</strong><div className="board-kpis"><i /><i /><i /></div><div className="board-chart"><i /><i /><i /><i /><i /><i /></div><div className="board-lines"><i /><i /><i /></div></div>
        </div>
      </div>
    );
  }

  if (kind === "secondary") {
    const periods = [
      ["08:00", "Mathematics", "Room 2", "Mr. Otieno"],
      ["09:00", "Biology", "Lab 1", "Ms. Wanjiku"],
      ["10:00", "English", "Room 4", "Mr. Kibet"],
      ["11:00", "Chemistry", "Lab 2", "Dr. Njeri"],
    ];
    return (
      <div className="board-illustration board-secondary" aria-label="Illustration of a school timetable" role="img">
        <div className="board-window"><span /><span /><span /><b>School timetable</b></div>
        <div className="board-timetable"><div className="board-timetable-head"><b>MONDAY</b><b>FORM 3</b></div>{periods.map(([time, subject, room, teacher]) => <div className="board-timetable-row" key={time}><small>{time}</small><strong>{subject}</strong><span>{room} · {teacher}</span></div>)}</div>
      </div>
    );
  }

  if (kind === "international") {
    return (
      <div className="board-illustration board-international" aria-label="Illustration of IGCSE predicted grades" role="img">
        <div className="board-window"><span /><span /><span /><b>IGCSE gradebook</b></div>
        <div className="board-igcse"><div><b>SUBJECT</b><b>ASSESSMENT</b><b>PREDICTED</b></div>{[["Mathematics", "81 / 100", "A*"], ["English", "76 / 100", "A"], ["Biology", "69 / 100", "B"], ["Chemistry", "74 / 100", "A"]].map(([subject, score, grade]) => <div key={subject}><span>{subject}</span><span>{score}</span><strong>{grade}</strong></div>)}</div>
      </div>
    );
  }

  return (
    <div className={`board-illustration board-${kind === "payments" ? "payments" : kind}`} aria-label={kind === "gradebook" ? "Illustration of a digital gradebook" : kind === "payments" ? "Illustration of an M-Pesa school payment" : "Illustration of a school dashboard"} role="img">
      <div className="board-window"><span /><span /><span /><b>{kind === "gradebook" ? "Assessment gradebook" : "School fee payment"}</b></div>
      {kind === "gradebook" ? (
        <div className="board-table"><div><b>Learning area</b><b>Assessment</b><b>Progress</b></div>{["Literacy", "Numeracy", "Environment", "Creative arts"].map((row, index) => <div key={row}><span>{row}</span><span>{["Meeting", "Achieving", "Developing", "Meeting"][index]}</span><i style={{ width: `${[82, 68, 54, 76][index]}%` }} /></div>)}</div>
      ) : (
        <div className="board-payment-card"><div className="board-payment-mark">M</div><b>Payment received</b><strong>KES 12,500</strong><span>School fees · Term 1</span><i>Receipt sent to parent</i></div>
      )}
    </div>
  );
}

export default function BoardSpotlight(props: BoardSpotlightProps) {
  return (
    <section className="board-spotlight content-section">
      <div className="board-spotlight-inner">
        <Illustration kind={props.kind} />
        <div className="board-spotlight-copy">
          <span className="board-eyebrow">{props.eyebrow}</span>
          <h2>{props.title}</h2>
          <p>{props.description}</p>
          <ul>{props.points.map((point) => <li key={point}><Check size={17} aria-hidden="true" />{point}</li>)}</ul>
          <Link href={props.href}>{props.linkLabel}<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
