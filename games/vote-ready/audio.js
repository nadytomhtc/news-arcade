const VoteAudio = (() => {
  'use strict';

  const toggle = document.querySelector('.arcade-sound');
  const melody = [
    72, 76, 79, 76, 74, 77, 81, 77,
    76, 79, 84, 79, 74, 77, 79, 67,
    72, 76, 79, 81, 77, 76, 74, 69,
    72, 76, 79, 76, 74, 71, 72, 0
  ];
  const bass = [48, 50, 52, 43, 48, 53, 48, 43];
  const beat = .27;
  let audio;
  let timer;
  let playing = false;
  let step = 0;
  let next = 0;

  function audible() {
    return !document.hidden && toggle.getAttribute('aria-pressed') === 'true';
  }

  function unlock() {
    if (!audible()) return false;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  function note(midi, at, length, volume, type = 'triangle') {
    const voice = audio.createOscillator();
    const gain = audio.createGain();
    voice.type = type;
    voice.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.linearRampToValueAtTime(volume, at + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    voice.connect(gain).connect(audio.destination);
    voice.start(at);
    voice.stop(at + length + .01);
  }

  function schedule() {
    if (!audible() || audio.state !== 'running') return;
    next = Math.max(next, audio.currentTime + .015);
    while (next < audio.currentTime + .12) {
      const lead = melody[step];
      if (lead) note(lead, next, .29, .035);
      if (step % 4 === 0) note(bass[step / 4], next, .42, .032, 'sine');
      if (step % 4 === 2) note(bass[(step - 2) / 4] + 7, next, .22, .022, 'sine');
      step = (step + 1) % melody.length;
      next += beat;
    }
  }

  function stop() {
    clearInterval(timer);
    timer = undefined;
  }

  function start() {
    playing = true;
    step = 0;
    next = 0;
    stop();
    if (unlock()) timer = setInterval(schedule, 55);
  }

  function cheer() {
    const at = audio.currentTime + .035;
    const samples = audio.createBuffer(1, audio.sampleRate * 1.15, audio.sampleRate);
    const noise = samples.getChannelData(0);
    for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
    const crowd = audio.createBufferSource();
    crowd.buffer = samples;
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1050;
    filter.Q.value = .45;
    const volume = audio.createGain();
    volume.gain.setValueAtTime(.001, at);
    volume.gain.linearRampToValueAtTime(.16, at + .19);
    volume.gain.exponentialRampToValueAtTime(.001, at + 1.13);
    crowd.connect(filter).connect(volume).connect(audio.destination);
    crowd.start(at);
    for (let i = 0; i < 9; i++) {
      const voice = audio.createOscillator();
      const mouth = audio.createBiquadFilter();
      const envelope = audio.createGain();
      const onset = at + i * .047;
      voice.type = 'sawtooth';
      voice.frequency.setValueAtTime(250 + i*33, onset);
      voice.frequency.exponentialRampToValueAtTime(440 + i*25, onset + .12);
      voice.frequency.exponentialRampToValueAtTime(220 + i*26, onset + .46);
      mouth.type = 'bandpass';
      mouth.frequency.value = 950 + i*72;
      envelope.gain.setValueAtTime(.0001, onset);
      envelope.gain.linearRampToValueAtTime(.028, onset + .10);
      envelope.gain.exponentialRampToValueAtTime(.0001, onset + .48);
      voice.connect(mouth).connect(envelope).connect(audio.destination);
      voice.start(onset);
      voice.stop(onset + .49);
    }
  }

  function finish(won) {
    playing = false;
    stop();
    if (won && audio && audible()) cheer();
  }

  function sync() {
    if (!audible()) {
      stop();
      audio?.suspend().catch(() => {});
    } else if (playing && unlock()) {
      stop();
      next = 0;
      timer = setInterval(schedule, 55);
    }
  }

  toggle.addEventListener('click', sync);
  document.addEventListener('visibilitychange', sync);
  return {start, finish};
})();
