import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import "./ErrorPage.css";

/* ------------------------------------------------------------------ */
/*  Edit the wording / buttons for every error here.                  */
/*  action types: { to } = link, { type: "back" }, { type: "reload" } */
/* ------------------------------------------------------------------ */
const HOME = { label: "Go to home", to: "/" };
const BACK = { label: "Go back", type: "back" };
const RETRY = { label: "Try again", type: "reload", primary: true };

export const ERROR_CONFIG = {
  400: {
    title: "That request wasn't valid",
    message:
      "The portal couldn't read the link or form data it received. Check the address for typos, or reload the page and try again.",
    actions: [{ ...RETRY }, BACK, HOME],
  },
  401: {
    title: "Sign in to continue",
    message:
      "This page is only available after you sign in. Your session may have expired, so sign in again to pick up where you left off.",
    actions: [
      { label: "Student login", to: "/erp/student", primary: true },
      { label: "Staff login", to: "/erp/staff" },
      { label: "Office login", to: "/erp/office/login" },
    ],
  },
  403: {
    title: "You don't have access to this page",
    message:
      "Your account isn't allowed to open this section. If you think this is a mistake, ask the school office to check your access.",
    actions: [{ ...BACK, primary: true }, HOME],
  },
  404: {
    title: "We can't find that page",
    message:
      "The address may have a typo, or the page may have been moved or removed.",
    showPath: true,
    suggest: true,
    actions: [{ ...HOME, primary: true }, BACK],
  },
  408: {
    title: "The request timed out",
    message:
      "Your connection was too slow to finish loading this page. Check your internet connection, then try again.",
    actions: [{ ...RETRY }, HOME],
  },
  429: {
    title: "Too many attempts",
    message:
      "You've sent too many requests in a short time. Wait a minute, then try again.",
    actions: [{ ...RETRY }, HOME],
  },
  500: {
    title: "Something went wrong on our side",
    message:
      "The portal hit an unexpected error. Try again in a moment. If it keeps happening, tell the school office what you were doing when it appeared.",
    actions: [{ ...RETRY }, HOME],
  },
  503: {
    title: "The portal is down for maintenance",
    message:
      "The system is being updated and will be back shortly. Try again in a few minutes.",
    actions: [{ ...RETRY }, HOME],
  },
};

const SUGGESTED_LINKS = [
  { label: "Home", to: "/" },
  { label: "Academic calendar", to: "/school/calendar" },
  { label: "Gallery", to: "/gallery" },
  { label: "Student ERP", to: "/erp/student" },
  { label: "Staff ERP", to: "/erp/staff" },
];

function ActionButton({ action }) {
  const navigate = useNavigate();
  const className = `err-btn${action.primary ? " err-btn--primary" : ""}`;

  if (action.to) {
    return (
      <Link className={className} to={action.to}>
        {action.label}
      </Link>
    );
  }

  const onClick =
    action.type === "reload"
      ? () => window.location.reload()
      : () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  return (
    <button type="button" className={className} onClick={onClick}>
      {action.label}
    </button>
  );
}

export default function ErrorPage({ code = 404 }) {
  const shown = ERROR_CONFIG[code] ? code : 404;
  const cfg = ERROR_CONFIG[shown];
  const { pathname } = useLocation();
  const headingRef = useRef(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${shown} - ${cfg.title}`;
    headingRef.current?.focus({ preventScroll: true });
    return () => {
      document.title = previousTitle;
    };
  }, [shown, cfg.title]);

  return (
    <section className="err-page" aria-labelledby="err-title">
      <span className="err-deco err-deco--circle" aria-hidden="true" />
      <span className="err-deco err-deco--ring" aria-hidden="true" />
      <span className="err-deco err-deco--square" aria-hidden="true" />
      <span className="err-deco err-deco--triangle" aria-hidden="true" />

      <div className="err-sheet">
        <p className="err-code" aria-hidden="true">
          {String(shown)
            .split("")
            .map((digit, i) => (
              <span key={i} className={`err-tile err-tile--${i % 3}`}>
                {digit}
              </span>
            ))}
        </p>

        <h1 id="err-title" className="err-title" tabIndex={-1} ref={headingRef}>
          <span className="err-sr">Error {shown}: </span>
          {cfg.title}
        </h1>

        <p className="err-message">{cfg.message}</p>

        {cfg.showPath && (
          <p className="err-path">
            <span>Address you opened:</span> <code>{pathname}</code>
          </p>
        )}

        <div className="err-actions">
          {cfg.actions.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}
        </div>

        {cfg.suggest && (
          <nav className="err-links" aria-label="Useful pages">
            <p>Pages you may be looking for</p>
            <ul>
              {SUGGESTED_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  );
}

/* Ready-made pages, one per status code */
export const BadRequest = () => <ErrorPage code={400} />;
export const Unauthorized = () => <ErrorPage code={401} />;
export const Forbidden = () => <ErrorPage code={403} />;
export const NotFound = () => <ErrorPage code={404} />;
export const RequestTimeout = () => <ErrorPage code={408} />;
export const TooManyRequests = () => <ErrorPage code={429} />;
export const ServerError = () => <ErrorPage code={500} />;
export const Maintenance = () => <ErrorPage code={503} />;

/* For the route  /error/:code  (e.g. navigate("/error/403")) */
export function ErrorRoute() {
  const { code } = useParams();
  return <ErrorPage code={Number(code)} />;
}