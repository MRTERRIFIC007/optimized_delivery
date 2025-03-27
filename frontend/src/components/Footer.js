import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>Delivery Prediction System</h5>
            <p className="small">
              Optimizing last-mile delivery through AI and machine learning
            </p>
          </div>
          <div className="col-md-3">
            <h6>Quick Links</h6>
            <ul className="list-unstyled">
              <li>
                <a href="/" className="text-light text-decoration-none">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/predict" className="text-light text-decoration-none">
                  Make Predictions
                </a>
              </li>
              <li>
                <a href="/optimize" className="text-light text-decoration-none">
                  Route Optimization
                </a>
              </li>
            </ul>
          </div>
          <div className="col-md-3">
            <h6>About</h6>
            <ul className="list-unstyled">
              <li>
                <a href="/" className="text-light text-decoration-none">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/" className="text-light text-decoration-none">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/" className="text-light text-decoration-none">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>
        <hr className="my-3 border-secondary" />
        <div className="text-center">
          <p className="small mb-0">
            &copy; {currentYear} Delivery Prediction System. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
