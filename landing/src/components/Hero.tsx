"use client";

import Link from "next/link";
import { ArrowRight, Play, CheckCircle, Star, Users, Globe } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="eyebrow">East Africa's Leading AI-Powered Software Company</div>
        <h1>Transforming Businesses Across Africa with Innovation</h1>
        <p className="subtext">
          Mylesoft Technologies delivers cutting-edge software solutions for education, healthcare, agriculture, and business sectors. Built for Africa, by Africans.
        </p>
        <div className="actions">
          <a href="/book-demo" className="btn btn-primary">
            <ArrowRight size={16} />
            Book a Demo
          </a>
          <a href="/contact" className="btn btn-secondary">
            Contact Sales
          </a>
        </div>
        <div className="trust-signals">
          <span className="trust-signal">
            <CheckCircle size={16} />
            500+ Schools Trust Us
          </span>
          <span className="trust-signal">
            <CheckCircle size={16} />
            6 East African Countries
          </span>
          <span className="trust-signal">
            <CheckCircle size={16} />
            20+ AI-Powered Products
          </span>
        </div>
      </div>
      <div className="hero-visual">
        <div className="dashboard-mockup">
          <div className="mockup-header">
            <div className="mockup-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="mockup-title">Mylesoft Dashboard</span>
          </div>
          <div className="mockup-body">
            <div className="mockup-sidebar">
              <div className="mockup-sidebar-item active" />
              <div className="mockup-sidebar-item" />
              <div className="mockup-sidebar-item" />
              <div className="mockup-sidebar-item" />
              <div className="mockup-sidebar-item" />
            </div>
            <div className="mockup-main">
              <div className="mockup-stat-row">
                <div className="mockup-stat-card c1" />
                <div className="mockup-stat-card c2" />
                <div className="mockup-stat-card c3" />
              </div>
              <div className="mockup-chart" />
              <div className="mockup-table">
                <div className="mockup-table-row" />
                <div className="mockup-table-row" />
                <div className="mockup-table-row" />
                <div className="mockup-table-row" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
