import React from "react";
import { Link, NavLink } from "react-router-dom";

const Header = () => {
  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <i className="bi bi-truck me-2"></i>
            Delivery Prediction System
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                  end
                >
                  <i className="bi bi-speedometer2 me-1"></i> Dashboard
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/predict"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <i className="bi bi-graph-up me-1"></i> Predict Delivery
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/optimize"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <i className="bi bi-geo-alt me-1"></i> Optimize Route
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/chat"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <i className="bi bi-chat-dots me-1"></i> Assistant
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
