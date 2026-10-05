import { useState } from 'react';
import { useAppStore } from '@/state';
import './AnalyticsScreen.css';

export function AnalyticsScreen() {
  const { pastSessions } = useAppStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (pastSessions.length === 0) {
    return (
      <div className="analytics-screen">
        <header className="analytics-header">
          <h1>Analytics</h1>
          <p>No past sessions recorded.</p>
        </header>
      </div>
    );
  }

  const selectedSession = selectedSessionId 
    ? pastSessions.find(s => s.sessionId === selectedSessionId) 
    : pastSessions[0];

  return (
    <div className="analytics-screen">
      <header className="analytics-header">
        <h1>Worker Ergonomics Session Summary</h1>
      </header>

      <div className="analytics-layout">
        {/* Left Column: Session History List */}
        <aside className="analytics-sidebar card">
          <h2 className="analytics-section-title">Session History</h2>
          <div className="session-list">
            {pastSessions.map(session => (
              <div 
                key={session.sessionId} 
                className={`session-item ${selectedSession?.sessionId === session.sessionId ? 'active' : ''}`}
                onClick={() => setSelectedSessionId(session.sessionId)}
              >
                <div className="session-item-date">
                  {new Date(session.startTime).toLocaleString()}
                </div>
                <div className="session-item-stats">
                  <span>Dur: {Math.round(session.duration / 60)}m {session.duration % 60}s</span>
                  <span>Ergo: {session.averageErgonomicRisk}/100</span>
                  <span>Fatigue: {session.averageFatigueRisk}/100</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Column: Session Details */}
        {selectedSession && (
          <main className="analytics-details">
            <div className="details-header card">
              <h2>Session: {new Date(selectedSession.startTime).toLocaleString()}</h2>
              <p>Session Duration: {Math.round(selectedSession.duration / 60)} min {selectedSession.duration % 60} sec</p>
              
              <div className="score-boxes">
                <div className="score-box">
                  <span className="label">Avg Ergonomic Risk</span>
                  <span className="value text-warning">{selectedSession.averageErgonomicRisk}/100</span>
                </div>
                <div className="score-box">
                  <span className="label">Max Ergonomic Risk</span>
                  <span className="value text-danger">{selectedSession.maximumErgonomicRisk}/100</span>
                </div>
                <div className="score-box">
                  <span className="label">Avg Fatigue Risk</span>
                  <span className="value text-warning">{selectedSession.averageFatigueRisk}/100</span>
                </div>
                <div className="score-box">
                  <span className="label">Max Fatigue Risk</span>
                  <span className="value text-danger">{selectedSession.maximumFatigueRisk}/100</span>
                </div>
              </div>
            </div>

            <div className="details-grid">
              <div className="card">
                <h3>Exposure</h3>
                <ul className="metrics-list">
                  <li>Trunk Exposure: {Math.round(selectedSession.trunkExposureDuration / 60)}m {selectedSession.trunkExposureDuration % 60}s</li>
                  <li>Neck Exposure: {Math.round(selectedSession.neckExposureDuration / 60)}m {selectedSession.neckExposureDuration % 60}s</li>
                  <li>High-Risk Time: {Math.round(selectedSession.timeHighRisk / 60)}m {selectedSession.timeHighRisk % 60}s</li>
                  <li>Recovery Time: {Math.round(selectedSession.recoveryDuration / 60)}m {selectedSession.recoveryDuration % 60}s</li>
                </ul>
              </div>
              
              <div className="card">
                <h3>Fatigue Assessment</h3>
                <ul className="metrics-list">
                  <li>Final Fatigue Risk: {selectedSession.samples[selectedSession.samples.length - 1]?.fatigueRisk || 0}/100</li>
                  <li>Status: <strong>{selectedSession.finalAssessment}</strong></li>
                </ul>
              </div>
            </div>

            <div className="card">
              <h3>Recommendations</h3>
              <ul className="recommendations-list">
                {selectedSession.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="card export-card">
              <button 
                className="action-button primary" 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedSession, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `session_${selectedSession.sessionId}.json`);
                  document.body.appendChild(downloadAnchorNode); // required for firefox
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
              >
                Export JSON
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
