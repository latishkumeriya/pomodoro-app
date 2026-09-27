import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PomodoroTimer } from './components/pomodoro/PomodoroTimer';
import { MascotDemo } from './components/mascot/MascotDemo';
import { Onboarding } from './components/onboarding/Onboarding';
import './components/onboarding/onboarding.css';

function isOnboarded() {
  try {
    return localStorage.getItem('pomo-onboarded-v1') === '1';
  } catch {
    return true;
  }
}

export function App() {
  const [done, setDone] = useState(isOnboarded);
  if (!done) {
    return <Onboarding onDone={() => setDone(true)} />;
  }
  return (
    <Routes>
      <Route path="/" element={<PomodoroTimer />} />
      <Route path="/mascot" element={<MascotDemo />} />
      <Route path="/tour" element={<Onboarding onDone={() => setDone(true)} />} />
      <Route path="*" element={<PomodoroTimer />} />
    </Routes>
  );
}
