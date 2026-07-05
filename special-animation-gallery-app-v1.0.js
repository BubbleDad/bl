(() => {
  "use strict";

  /***************************************************************************
   * Meowmoon Special Animation Gallery v1.0 preview runtime
   * Preview-only copy based on Meowmoon Bowling app-v1.5.17.
   * Design: no choices, no score, no frames, no losing, no ads, no timers.
   **************************************************************************/

  console.log("Meowmoon Special Animation Gallery preview runtime loaded: v1.0");

  // =====================================================
  // CODE MAP
  // =====================================================
  // 1. Canvas, constants, and game state
  // 2. Special animation registry
  // 3. Audio
  // 4. Layout, level setup, pin generation
  // 5. Input, pause/resume, phase-state helpers
  // 6. Ball movement and pin lifecycle
  // 7. Particles and celebration effects
  // 8. Rendering pipeline and drawing functions
  // 9. Main loop and startup
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const startOverlay = document.getElementById("startOverlay");

  const TAU = Math.PI * 2;
  const LEVEL_REWARD_MS = 1550;
  const NEXT_LEVEL_DELAY_MS = 550;
  const LONG_PRESS_MS = 3000;
  const AUTO_PAUSE_GRACE_MS = 500;
  const ROTATING_TEXT_MS = 60000;
  const BALL_SPEED = 740; // CSS pixels per second; steady and not twitchy.
  const PIN_FADE_DELAY_MS = 220;
  const PIN_FADE_MS = 720;
  const MAX_ROLLS_PER_LEVEL = 8;
  const STARTUP_READY_CHECK_MS = 1200;
  // =====================================================
  // SPECIAL ANIMATION REGISTRY
  // =====================================================
  // This registry is the central source for special pin animations.
  // It intentionally preserves the current animation set and behavior.
  //
  // updateMode values:
  // - "path": standard moving animation that follows a generated path.
  // - "staticTimed": custom draw/update animation that manages its own motion.
  // - "custom": older custom update branch below; retained for behavior preservation.
  const SPECIAL_ANIMATION_REGISTRY = {
    rocket: { label: "Rocket", duration: () => randInt(2400, 3200), updateMode: "path", draw: drawRocketPin },
    pinata: { label: "Pinata", duration: () => randInt(1000, 1500), updateMode: "custom", draw: drawPinataPin },
    pinatastar: { label: "Star Pinata", duration: () => randInt(1100, 1600), updateMode: "custom", draw: drawPinataStarPin },
    balloon: { label: "Balloon", duration: () => randInt(1800, 2600), updateMode: "path", draw: drawBalloonPin },
    firework: { label: "Firework", duration: () => randInt(1700, 2500), updateMode: "path", draw: drawFireworkPin },
    jelly: { label: "Jelly", duration: () => randInt(1200, 1900), updateMode: "custom", draw: drawJellyPin },
    catpaw: { label: "Cat Paw", duration: () => randInt(2400, 3300), updateMode: "custom", draw: drawCatPawPin },
    toytrain: { label: "Toy Train", duration: () => randInt(1800, 2600), updateMode: "path", draw: drawToyTrainPin },
    popcorn: { label: "Popcorn", duration: () => randInt(1900, 2500), updateMode: "custom", draw: drawPopcornPin },
    kite: { label: "Kite", duration: () => randInt(1800, 2600), updateMode: "path", draw: drawKitePin },
    magicpaint: { label: "Magic Paint", duration: () => randInt(1200, 1800), updateMode: "custom", draw: drawMagicPaintPin },
    flower: { label: "Flower", duration: () => randInt(1300, 2100), updateMode: "custom", draw: drawFlowerPin },
    racecar: { label: "Race Car", duration: () => randInt(1600, 2400), updateMode: "path", draw: drawRaceCarPin },
    airplane: { label: "Airplane", duration: () => randInt(2000, 2900), updateMode: "path", draw: drawAirplanePin },
    helicopter: { label: "Helicopter", duration: () => randInt(2200, 3200), updateMode: "path", draw: drawHelicopterPin },
    bus: { label: "School Bus", duration: () => randInt(1800, 2500), updateMode: "path", draw: drawBusPin },
    bulldozer: { label: "Bulldozer", duration: () => randInt(1900, 2700), updateMode: "path", draw: drawBulldozerPin },
    bunny: { label: "Bunny", duration: () => randInt(1700, 2400), updateMode: "path", draw: drawBunnyPin },
    frog: { label: "Frog", duration: () => randInt(1800, 2500), updateMode: "path", draw: drawFrogPin },
    bird: { label: "Bird", duration: () => randInt(1800, 2500), updateMode: "path", draw: drawBirdPin },
    dogzoomies: { label: "Dog Zoomies", duration: () => randInt(2100, 3000), updateMode: "path", draw: drawDogPin },
    batbaseball: { label: "Bat and Baseball", duration: () => randInt(1500, 2300), updateMode: "path", draw: drawBatBaseballPin },
    basketballdribble: { label: "Basketball Dribble", duration: () => randInt(1800, 2600), updateMode: "path", draw: drawBasketballDribblePin },
    basketballhoop: { label: "Basketball Hoop", duration: () => randInt(1700, 2500), updateMode: "path", draw: drawBasketballHoopPin },
    hockeypuck: { label: "Hockey", duration: () => randInt(1500, 2300), updateMode: "path", draw: drawHockeyPuckPin },
    curling: { label: "Curling", duration: () => randInt(2400, 3200), updateMode: "path", draw: drawCurlingPin },
    footballthrow: { label: "Football Throw", duration: () => randInt(2100, 2900), updateMode: "path", draw: drawFootballThrowPin },
    soccergoal: { label: "Soccer Goal", duration: () => randInt(1700, 2500), updateMode: "path", draw: drawSoccerGoalPin },
    tennisserve: { label: "Tennis Serve", duration: () => TENNISSERVE_DURATION_MS, updateMode: "staticTimed", overlay: true, draw: drawTennisServePin },
    golfdrive: { label: "Golf Drive", duration: () => randInt(1600, 2400), updateMode: "path", draw: drawGolfDrivePin },
    baseballcatch: { label: "Baseball Catch", duration: () => randInt(1600, 2400), updateMode: "path", draw: drawBaseballCatchPin },
    bowlingstrike: { label: "Bowling Strike", duration: () => randInt(1700, 2500), updateMode: "path", draw: drawBowlingStrikePin },
    jogstrollerparent: { label: "Jogging Stroller Parent", duration: () => randInt(2200, 2800), updateMode: "staticTimed", draw: drawJogStrollerParentPin },
    wheelchairhumanA: { label: "Wheelchair Racer A", duration: () => randInt(2200, 2800), updateMode: "staticTimed", draw: (pin, current) => drawWheelchairGalleryPin(pin, current, "humanA") },
    wheelchairhumanB: { label: "Wheelchair Racer B", duration: () => randInt(2200, 2800), updateMode: "staticTimed", draw: (pin, current) => drawWheelchairGalleryPin(pin, current, "humanB") },
    maplegrow: { label: "Star Tree", duration: () => randInt(2800, 3600), updateMode: "staticTimed", draw: drawStarTreePin },
    vanlift: { label: "Wheelchair Van Lift", duration: () => randInt(3400, 4000), updateMode: "staticTimed", draw: drawVanLiftPin },
    marblerun: { label: "Marble Run", duration: () => randInt(9800, 11500), updateMode: "staticTimed", draw: drawMarbleRunPin },
    regularwheelchair: { label: "Regular Wheelchair", duration: () => randInt(2600, 3200), updateMode: "staticTimed", draw: drawRegularWheelchairPin },
    threestartrees: { label: "Three Star Trees", duration: () => randInt(3800, 4600), updateMode: "staticTimed", draw: drawThreeStarTreesPin },
    giraffewalk: { label: "Giraffe Walk", duration: () => randInt(3200, 3900), updateMode: "staticTimed", draw: drawGiraffeWalkPin },
    elephantwave: { label: "Elephant", duration: () => randInt(3600, 4300), updateMode: "staticTimed", draw: drawElephantWavePin },
    heartdraw: { label: "Heart Drawing", duration: () => randInt(3200, 3800), updateMode: "staticTimed", overlay: true, draw: drawHeartDrawPin },
    suntravel: { label: "Sun Travel", duration: () => randInt(5200, 6200), updateMode: "staticTimed", overlay: true, exclusiveGroup: "sun", draw: drawSunTravelPin },
    sunplanets: { label: "Sun and 9 Planets", duration: () => randInt(6000, 7000), updateMode: "staticTimed", overlay: true, exclusiveGroup: "sun", draw: drawSunPlanetsPin },
    dandelionlife: { label: "Dandelion Lifecycle", duration: () => randInt(7200, 8200), updateMode: "staticTimed", overlay: true, draw: drawDandelionLifePin },
    firetruck: { label: "Fire Truck", duration: () => randInt(3000, 3600), updateMode: "staticTimed", draw: drawFireTruckPin },
    crutcheswalk: { label: "Underarm Crutches Walk", duration: () => randInt(5800, 6800), updateMode: "staticTimed", draw: drawUnderarmCrutchesWalkPin },
    trainlinked: { label: "Connected Train", duration: () => TRAINLINKED_DURATION_MS, updateMode: "staticTimed", overlay: true, draw: trainlinkedDrawPin },
    dragonfirev5: { label: "Friendly Dragon Fire", duration: () => 4600, updateMode: "staticTimed", overlay: true, draw: dragonfirev5DrawPin },
    millyardgearv3: { label: "Millyard Gear Machine", duration: () => 3600, updateMode: "staticTimed", overlay: true, draw: millyardgearv3DrawPin },
    lightrailv2: { label: "Light Rail Glide", duration: () => 3800, updateMode: "staticTimed", overlay: true, draw: lightrailv2DrawPin },
    raptorwingv2: { label: "Raptor Wing Glide", duration: () => 3900, updateMode: "staticTimed", overlay: true, draw: raptorwingv2DrawPin },
    raptorleftv1: { label: "Raptor Up Left Exit", duration: () => 3900, updateMode: "staticTimed", overlay: true, draw: raptorleftv1DrawPin },
    tugboatbob: { label: "Tugboat Bob", duration: () => 3600, updateMode: "staticTimed", overlay: true, draw: tugboatv1DrawPin },
    jellybeanv3: { label: "Jellybean Row Color Pop", duration: () => 3400, updateMode: "staticTimed", overlay: true, draw: jellybeanv3DrawPin },
    tulipbloomwave: { label: "Tulip Bloom Wave", duration: () => 3600, updateMode: "staticTimed", overlay: true, draw: tulipsv3DrawPin },
    ribbondance: { label: "Ribbon Dance", duration: () => 3600, updateMode: "staticTimed", overlay: true, draw: ribbondancev3DrawPin },
    metrotrain: { label: "Metro Train", duration: () => 3800, updateMode: "staticTimed", overlay: true, draw: metrotrainv2DrawPin },
    cardinalglide: { label: "Cardinal Glide", duration: () => 4200, updateMode: "staticTimed", overlay: true, draw: cardinalv3DrawPin },
    cardinalflyoff: { label: "Cardinal Flies Off Screen", duration: () => 4300, updateMode: "staticTimed", overlay: true, draw: cardinalflyoffv1DrawPin },
    hanbokribbontwirl: { label: "Hanbok Ribbon Twirl", duration: () => 3400, updateMode: "staticTimed", overlay: true, draw: hanbokv2DrawPin },
    merseyferry: { label: "Mersey Ferry Glide", duration: () => 3600, updateMode: "staticTimed", overlay: true, draw: merseyferryv1DrawPin },
    tropicalbirdhop: { label: "Tropical Bird Hop", duration: () => 3800, updateMode: "staticTimed", overlay: true, draw: tropicalbirdv2DrawPin },
    rainbowbridgepop: { label: "Rainbow Bridge Pop", duration: () => 3200, updateMode: "staticTimed", overlay: true, draw: rainbowbridgepopv2DrawPin },
    mosaictileshimmer: { label: "Mosaic Tile Shimmer", duration: () => 3400, updateMode: "staticTimed", overlay: true, draw: mosaictileshimmerv2DrawPin },
    columncircledance: { label: "Column Circle Dance", duration: () => 3400, updateMode: "staticTimed", overlay: true, draw: columncircledancev2DrawPin },
    orangewhitegreenribbon: { label: "Orange White Green Ribbon", duration: () => 3400, updateMode: "staticTimed", overlay: true, draw: orangewhitegreenribbonv1DrawPin },
    streetcarbellroll: { label: "Streetcar Bell Roll", duration: () => 3500, updateMode: "staticTimed", overlay: true, draw: streetcarbellv1DrawPin },
    campwagonv2: { label: "Camp Wagon Roll", duration: () => 3500, updateMode: "staticTimed", overlay: true, draw: campwagonv2DrawPin },
    flowerwavev2: { label: "Flower Wave Bloom", duration: () => 3400, updateMode: "staticTimed", overlay: true, draw: flowerwavev2DrawPin },
    garbagebinlift: { label: "Garbage Bin Lift", duration: () => 6600, updateMode: "staticTimed", overlay: true, draw: garbagebinliftv11DrawPin },
    gimmelthreedrums: { label: "Gimmel Three Drums", duration: () => 3400, updateMode: "staticTimed", overlay: true, draw: gimmelthreedrumsv3DrawPin },
    friendlystarshipglide: { label: "Friendly Starship Glide", duration: () => 3600, updateMode: "staticTimed", overlay: true, draw: friendlystarshipglidev1DrawPin },
    sofashufflefivepillows: { label: "Sofa Shuffle Five Pillows", duration: () => 4200, updateMode: "staticTimed", overlay: true, draw: sofashufflefivepillowsv1DrawPin },
    yellowchickhatch: { label: "Yellow Chick Hatch", duration: () => YELLOWCHICKHATCH_DURATION_MS, updateMode: "staticTimed", overlay: true, draw: yellowchickhatchDrawPin },
    babystegosaurushatch: { label: "Baby Stegosaurus Hatch", duration: () => BABYSTEGOSAURUSHATCH_DURATION_MS, updateMode: "staticTimed", overlay: true, draw: babystegosaurushatchDrawPin },
    kangaroopouchsurprise: { label: "Kangaroo Pouch Surprise", duration: () => KANGAROOPOUCHSURPRISE_DURATION_MS, updateMode: "staticTimed", overlay: true, draw: kangaroopouchsurpriseDrawPin },
    wombatburrowbuilder: { label: "Wombat Burrow Builder", duration: () => WOMBATBURROWBUILDER_DURATION_MS, updateMode: "staticTimed", overlay: true, draw: wombatburrowbuilderDrawPin }
  };

  const PIN_SPECIAL_TYPES = Object.keys(SPECIAL_ANIMATION_REGISTRY);

  const SFX_GAIN = 4.1;

  // =====================================================
  // LIFECYCLE SAFETY GUARDRAILS
  // =====================================================
  // These are defensive maximums. They should not affect normal play.
  // They only clean up a state if an animation, falling pin, ball, or resolving
  // phase takes much longer than expected.
  const MAX_BALL_ROLL_MS = 9000;
  const MAX_RESOLVING_MS = 14000;
  const MAX_FALLING_PIN_MS = 4600;
  const PIN_CLEANUP_GRACE_MS = 900;
  const SPECIAL_ANIMATION_GRACE_MS = 1400;


  const ROTATING_STATUS_TEXTS = [
    "Press cat for 3 seconds to pause game",
    "Music: Jesu, Joy of Mans Desiring by Bach",
    "Meowmoon loves to play with you"
  ];

  const view = { w: 720, h: 1080, dpr: 1 };
  const layout = {
    unit: 36,
    radius: 30,
    topBand: 92,
    playTop: 126,
    playBottom: 810,
    wallLeft: 32,
    wallRight: 688,
    rollerX: 360,
    rollerY: 982,
    ballR: 30,
    pinH: 62,
    pinW: 26,
    catX: 255,
    catY: 986,
    textX: 484,
    textY: 884,
    textW: 205,
    textH: 150,
    statusX: 470,
    statusY: 946,
    statusW: 210,
    statusH: 92,
    launcherZoneTop: 832
  };

  const game = {
    level: 0,
    pins: [],
    ball: null,
    pathPreview: [],
    titleStartedAt: performance.now(),
    introDismissed: false,
    phase: "title", // title, playing, rolling, resolving, reward, paused
    previousPhase: "playing",
    phaseChangedAt: performance.now(),
    phaseChangeReason: "initial",
    rewardStartedAt: 0,
    nextLevelAt: 0,
    resolvingUntil: 0,
    resolvingStartedAt: 0,
    lastLifecycleWarningAt: 0,
    forceHitNext: false,
    hold: null,
    pauseTimer: null,
    pausedAt: 0,
    messageIndex: 0,
    message: "Hi there, bowler! Tap anywhere to play.",
    particles: [],
    nextBallSeed: 0,
    rollsThisLevel: 0,
    specialBallMap: {},
    remainingSpecialPins: 0,
    bounceBursts: [],
    pinSpecialQueue: []
  };

  const messages = [
    "Hi there, bowler!\nTap anywhere to play.",
    "Great roll!\nEvery roll helps.",
    "You can bounce\noff the sides!",
    "Meowmoon is cheering\nfor you!",
    "Knock down the pins\none roll at a time.",
    "Nice bowling!\nYou've got this!"
  ];

  const audio = {
    context: null,
    musicAudio: null,
    usingFileMusic: false,
    synthMusicTimer: null,
    synthNoteIndex: 0,
    nextNoteAt: 0,
    rollNoise: null,
    rollGain: null,
    rocketNoise: null,
    rocketGain: null,
    isStarted: false,
    isMutedByPause: false,
    pattern: [
      392.00, 440.00, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00,
      392.00, 493.88, 587.33, 659.25, 587.33, 523.25, 493.88, 440.00
    ],

    async start() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.context = new AudioContext();
      }
      if (this.context && this.context.state === "suspended") {
        this.context.resume().catch(() => {});
      }
      this.isStarted = true;
      this.isMutedByPause = false;
      await this.startMusic();
    },

    async startMusic() {
      if (this.isMutedByPause) return;
      if (!this.musicAudio) {
        this.musicAudio = document.getElementById("bachMusic") || new Audio("audio/jesu-joy-piano-loop.mp3");
        this.musicAudio.loop = true;
        this.musicAudio.volume = 0.42;
        this.musicAudio.muted = false;
        this.musicAudio.setAttribute("playsinline", "");
        this.musicAudio.setAttribute("webkit-playsinline", "");
        this.musicAudio.preload = "auto";
      }
      try {
        await this.musicAudio.play();
        this.usingFileMusic = true;
      } catch (err) {
        this.usingFileMusic = false;
      }
    },

    pauseMusic() {
      this.isMutedByPause = true;
      if (this.musicAudio) this.musicAudio.pause();
      this.stopRolling();
      this.stopRocketFlight();
    },

    resumeMusic() {
      this.isMutedByPause = false;
      if (!this.isStarted) return;
      this.startMusic();
    },

    startSynthMusic() {
      if (!this.context || this.synthMusicTimer) return;
      this.synthNoteIndex = 0;
      this.nextNoteAt = this.context.currentTime + 0.03;
      this.scheduleSynthMusic();
      this.synthMusicTimer = window.setInterval(() => this.scheduleSynthMusic(), 260);
    },

    stopSynthMusic() {
      if (this.synthMusicTimer) {
        window.clearInterval(this.synthMusicTimer);
        this.synthMusicTimer = null;
      }
    },

    scheduleSynthMusic() {
      if (!this.context || this.isMutedByPause) return;
      const horizon = this.context.currentTime + 1.1;
      while (this.nextNoteAt < horizon) {
        const freq = this.pattern[this.synthNoteIndex % this.pattern.length];
        this.playTone(freq, this.nextNoteAt, 0.34, 0.055, "triangle", 1200);
        if (this.synthNoteIndex % 4 === 0) {
          this.playTone(freq / 2, this.nextNoteAt, 0.48, 0.035, "sine", 700);
        }
        this.synthNoteIndex += 1;
        this.nextNoteAt += 0.31;
      }
    },

    playTone(freq, at, duration, gainValue, type = "sine", filterFreq = 2000) {
      if (!this.context) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, at);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.992), at + duration);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, at);
      const effectiveGain = Math.min(0.62, Math.max(0.0001, gainValue * SFX_GAIN));
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(effectiveGain, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);
      osc.start(at);
      osc.stop(at + duration + 0.04);
    },

    startRolling() {
      if (!this.context || this.isMutedByPause || this.rollNoise) return;
      const bufferSize = 2 * this.context.sampleRate;
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        const t = i / this.context.sampleRate;
        // Soft granular rumble, deliberately non-comedic.
        data[i] = (Math.random() * 2 - 1) * 0.24 * (0.65 + 0.35 * Math.sin(t * 68));
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 210;
      const gain = this.context.createGain();
      gain.gain.value = 0.038;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);
      source.start();
      this.rollNoise = source;
      this.rollGain = gain;
    },

    stopRolling() {
      if (!this.rollNoise) return;
      try { this.rollNoise.stop(); } catch (err) {}
      this.rollNoise = null;
      this.rollGain = null;
    },

    rocketLaunch() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(110, now, 0.18, 0.12, "sawtooth", 900);
      this.playTone(260, now + 0.035, 0.22, 0.075, "triangle", 1400);
      this.startRocketFlight();
    },

    startRocketFlight() {
      if (!this.context || this.isMutedByPause || this.rocketNoise) return;
      const bufferSize = Math.floor(this.context.sampleRate * 1.1);
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        const t = i / this.context.sampleRate;
        data[i] = (Math.random() * 2 - 1) * 0.34 * (0.75 + 0.25 * Math.sin(t * 150));
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 860;
      filter.Q.value = 0.8;
      const gain = this.context.createGain();
      gain.gain.value = 0.11;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);
      source.start();
      this.rocketNoise = source;
      this.rocketGain = gain;
    },

    stopRocketFlight() {
      if (!this.rocketNoise) return;
      try { this.rocketNoise.stop(); } catch (err) {}
      this.rocketNoise = null;
      this.rocketGain = null;
    },

    rocketBurst() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(90, now, 0.18, 0.13, "sawtooth", 650);
      this.playTone(180, now + 0.025, 0.20, 0.09, "square", 850);
      [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((f, i) => {
        this.playTone(f, now + 0.06 + i * 0.025, 0.28, 0.055, "triangle", 1900);
      });
    },

    pinataBurst() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(180, now, 0.14, 0.10, "square", 800);
      this.playTone(260, now + 0.03, 0.18, 0.08, "triangle", 1400);
      this.playTone(720, now + 0.07, 0.22, 0.045, "triangle", 2200);
    },

    balloonInflate() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(220, now, 0.22, 0.05, "sine", 1200);
      this.playTone(300, now + 0.08, 0.24, 0.04, "triangle", 1500);
    },

    balloonPop() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(480, now, 0.08, 0.07, "square", 2000);
      this.playTone(860, now + 0.015, 0.12, 0.04, "triangle", 2400);
    },

    fireworkLaunch() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(140, now, 0.12, 0.10, "sawtooth", 1000);
      this.playTone(220, now + 0.03, 0.18, 0.08, "triangle", 1400);
      this.startRocketFlight();
    },

    fireworkBurst() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      [520, 650, 820, 1040, 1300].forEach((f, i) => this.playTone(f, now + i * 0.02, 0.24, 0.055, "triangle", 2400));
      this.playTone(120, now, 0.16, 0.12, "square", 900);
    },

    jellyWobble() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(190, now, 0.20, 0.05, "sine", 700);
      this.playTone(150, now + 0.12, 0.24, 0.05, "triangle", 900);
    },

    jellyMelt() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(300, now, 0.20, 0.04, "triangle", 1200);
      this.playTone(180, now + 0.06, 0.26, 0.05, "sine", 800);
    },

    catPawSwipe() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(240, now, 0.14, 0.06, "triangle", 1200);
      this.playTone(160, now + 0.04, 0.10, 0.06, "square", 900);
    },

    catPawBop() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(180, now, 0.10, 0.09, "square", 850);
      this.playTone(520, now + 0.02, 0.16, 0.04, "triangle", 1700);
    },

    toyTrainStart() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(180, now, 0.12, 0.09, "square", 900);
      this.playTone(240, now + 0.12, 0.12, 0.08, "square", 900);
      this.playTone(980, now + 0.24, 0.18, 0.055, "triangle", 2200);
    },

    toyTrainChug() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(150, now, 0.10, 0.075, "square", 650);
      this.playTone(210, now + 0.035, 0.10, 0.055, "triangle", 900);
    },

    popcornCluster() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      [360, 520, 440, 680, 580, 760].forEach((f, i) => this.playTone(f, now + i * 0.035, 0.08, 0.075, "square", 1800));
    },

    kiteWhoosh() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(260, now, 0.26, 0.065, "sine", 1100);
      this.playTone(420, now + 0.10, 0.30, 0.055, "triangle", 1600);
      this.playTone(620, now + 0.22, 0.24, 0.045, "triangle", 1900);
    },

    brushSwish() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(320, now, 0.10, 0.065, "triangle", 1200);
      this.playTone(720, now + 0.05, 0.18, 0.060, "triangle", 2400);
    },

    paintSplash() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(190, now, 0.14, 0.10, "square", 800);
      [440, 560, 700].forEach((f, i) => this.playTone(f, now + 0.05 + i * 0.035, 0.16, 0.060, "triangle", 1900));
    },

    flowerBloom() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.playTone(f, now + i * 0.045, 0.24, 0.060, "triangle", 2200));
    },

    raceCarRev() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(120, now, 0.14, 0.12, "sawtooth", 800);
      this.playTone(180, now + 0.04, 0.18, 0.10, "sawtooth", 1100);
      this.playTone(280, now + 0.09, 0.22, 0.08, "square", 1400);
    },

    raceCarSkid() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(320, now, 0.08, 0.09, "square", 1600);
      this.playTone(210, now + 0.02, 0.10, 0.09, "triangle", 1200);
    },

    airplaneTakeoff() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(180, now, 0.18, 0.10, "sawtooth", 900);
      this.playTone(260, now + 0.06, 0.26, 0.09, "triangle", 1400);
      this.playTone(420, now + 0.14, 0.30, 0.07, "triangle", 1800);
    },

    airplanePass() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(560, now, 0.16, 0.07, "triangle", 1900);
      this.playTone(760, now + 0.04, 0.18, 0.06, "triangle", 2200);
    },

    helicopterStart() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(140, now, 0.12, 0.11, "square", 700);
      this.playTone(190, now + 0.04, 0.12, 0.10, "square", 850);
      this.playTone(240, now + 0.08, 0.14, 0.09, "square", 1000);
    },

    helicopterChop() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(180, now, 0.06, 0.09, "square", 900);
      this.playTone(220, now + 0.03, 0.06, 0.07, "square", 1100);
    },

    busHorn() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(220, now, 0.16, 0.12, "square", 1000);
      this.playTone(330, now + 0.04, 0.16, 0.10, "triangle", 1300);
    },

    busDrive() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(140, now, 0.10, 0.08, "square", 650);
      this.playTone(180, now + 0.03, 0.10, 0.06, "triangle", 900);
    },

    bulldozerRumble() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(90, now, 0.16, 0.13, "sawtooth", 500);
      this.playTone(130, now + 0.04, 0.18, 0.10, "square", 700);
    },

    bulldozerClank() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(220, now, 0.08, 0.10, "square", 1300);
      this.playTone(440, now + 0.025, 0.12, 0.06, "triangle", 2200);
    },

    bunnyHop() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(420, now, 0.10, 0.07, "triangle", 1600);
      this.playTone(620, now + 0.05, 0.12, 0.05, "triangle", 2200);
    },

    frogBoing() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(180, now, 0.12, 0.10, "square", 700);
      this.playTone(260, now + 0.06, 0.16, 0.07, "triangle", 1100);
    },

    birdChirp() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(760, now, 0.08, 0.05, "triangle", 2400);
      this.playTone(980, now + 0.03, 0.10, 0.04, "triangle", 2800);
    },

    dogZoomies() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      this.playTone(360, now, 0.08, 0.08, "square", 1400);
      this.playTone(520, now + 0.035, 0.10, 0.06, "triangle", 1900);
      this.playTone(300, now + 0.09, 0.08, 0.07, "square", 1200);
    },

    hitPins(count = 1) {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      const hits = Math.min(8, Math.max(1, count));
      for (let i = 0; i < hits; i += 1) {
        this.playTone(150 + i * 24, now + i * 0.025, 0.18, 0.08, "square", 600);
        this.playTone(420 + i * 30, now + i * 0.032, 0.12, 0.035, "triangle", 1600);
      }
    },

    pinFall(count = 1) {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime + 0.06;
      const falls = Math.min(6, Math.max(1, count));
      for (let i = 0; i < falls; i += 1) {
        this.playTone(260 - i * 14, now + i * 0.055, 0.16, 0.045, "sawtooth", 900);
      }
    },

    reward() {
      if (!this.context || this.isMutedByPause) return;
      const now = this.context.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.playTone(f, now + i * 0.085, 0.34, 0.085, "triangle", 1800));
    }
  };

  const rand = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  const nowMs = () => performance.now();

  function normalizeAngle(angle) {
    while (angle <= -Math.PI) angle += TAU;
    while (angle > Math.PI) angle -= TAU;
    return angle;
  }

  function angleDistance(a, b) {
    return Math.abs(normalizeAngle(a - b));
  }

  function resize() {
    view.dpr = Math.max(1, Math.min(2.4, window.devicePixelRatio || 1));
    view.w = Math.max(320, window.innerWidth || 720);
    view.h = Math.max(480, window.innerHeight || 1080);
    canvas.width = Math.floor(view.w * view.dpr);
    canvas.height = Math.floor(view.h * view.dpr);
    canvas.style.width = `${view.w}px`;
    canvas.style.height = `${view.h}px`;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    computeLayout();
  }

  function computeLayout() {
    layout.unit = clamp(Math.min(view.w / 15.8, view.h / 26.0), 22, 42);
    layout.topBand = clamp(view.h * 0.085, 60, 104);
    layout.playTop = layout.topBand + layout.unit * 1.05;
    layout.rollerY = view.h - Math.max(54, view.h * 0.078);
    layout.rollerX = view.w * 0.50;
    layout.ballR = clamp(layout.unit * 0.86, 22, 34);
    layout.radius = layout.ballR;
    // v0.2: pins are doubled from v0.1's 44-70px height range to 88-140px.
    layout.pinH = clamp(layout.unit * 3.36, 88, 140);
    layout.pinW = layout.pinH * 0.43;
    layout.launcherZoneTop = layout.rollerY - layout.unit * 4.65;
    layout.playBottom = layout.launcherZoneTop - layout.unit * 0.25;
    layout.wallLeft = layout.ballR + 8;
    layout.wallRight = view.w - layout.ballR - 8;

    // Same relative mascot placement as Bubble Shooter v0.9 snippets: launcherX - radius*3.15.
    layout.catX = layout.rollerX - layout.ballR * 3.15;
    layout.catY = layout.rollerY + layout.ballR * 0.12;

    // Same text/status box placement formula as Bubble Shooter v0.9, with the bowling roller as the launcher reference.
    layout.statusX = layout.rollerX + layout.radius * 1.75;
    layout.statusY = layout.rollerY - layout.radius * 0.85;
    layout.statusW = Math.max(layout.radius * 2.45, view.w - layout.statusX - Math.max(12, view.w * 0.025));
    layout.statusH = layout.radius * 1.85;
    layout.textX = layout.statusX;
    layout.textY = layout.statusY;
    layout.textW = layout.statusW;
    layout.textH = layout.statusH;
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(resize, 150), { passive: true });

  function startLevel() {
    game.level += 1;
    game.pins = [];
    game.ball = null;
    game.pathPreview = [];
    const openingPhase = game.level === 1 && !game.introDismissed ? "title" : "playing";
    setGamePhase(openingPhase, "start-level");
    game.forceHitNext = false;
    game.particles = [];
    game.rollsThisLevel = 0;
    game.specialBallMap = {};
    game.remainingSpecialPins = 0;
    game.bounceBursts = [];
    game.resolvingStartedAt = 0;
    game.pinSpecialQueue = buildPinSpecialQueue();
    game.messageIndex = (game.level - 1) % messages.length;
    game.message = messages[game.messageIndex];
    if (game.level === 1 && !game.introDismissed) {
      game.titleStartedAt = nowMs();
      showStartOverlay();
    } else {
      hideStartOverlay();
    }
    generatePins();
    assignSpecialPins();
    assignSpecialBalls();
  }

  function shuffled(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function animationSpec(type) {
    return SPECIAL_ANIMATION_REGISTRY[type] || null;
  }

  function animationDuration(type) {
    const spec = animationSpec(type);
    return spec?.duration ? spec.duration() : randInt(1700, 2500);
  }

  function animationUpdateMode(type) {
    return animationSpec(type)?.updateMode || "custom";
  }

  function isOverlayAnimation(type) {
    return !!animationSpec(type)?.overlay;
  }

  function animationDrawFunction(type) {
    return animationSpec(type)?.draw || null;
  }

  function transformSpecialAnimationBounds(bounds, options = {}) {
    if (!options.mirrorX) return { minX: bounds.minX, maxX: bounds.maxX, minY: bounds.minY, maxY: bounds.maxY };
    return { minX: -bounds.maxX, maxX: -bounds.minX, minY: bounds.minY, maxY: bounds.maxY };
  }

  function fitSpecialAnimationPlacement({
    preferredX,
    preferredY,
    naturalScale,
    bounds,
    policy = "containAll",
    safeArea,
    margin = 8,
    mirrorX = false
  }) {
    const transformedBounds = transformSpecialAnimationBounds(bounds, { mirrorX });
    const safeLeft = (safeArea?.left ?? 0) + margin;
    const safeTop = (safeArea?.top ?? 0) + margin;
    const safeRight = (safeArea?.right ?? view.w) - margin;
    const safeBottom = (safeArea?.bottom ?? view.h) - margin;
    const safeWidth = Math.max(1, safeRight - safeLeft);
    const safeHeight = Math.max(1, safeBottom - safeTop);
    const boundsWidth = Math.max(1, transformedBounds.maxX - transformedBounds.minX);
    const boundsHeight = Math.max(1, transformedBounds.maxY - transformedBounds.minY);
    const fitScale = policy === "containAll"
      ? Math.min(naturalScale, safeWidth / boundsWidth, safeHeight / boundsHeight)
      : naturalScale;
    const resolvedScale = Math.max(0.01, fitScale);
    const minAnchorX = safeLeft - transformedBounds.minX * resolvedScale;
    const maxAnchorX = safeRight - transformedBounds.maxX * resolvedScale;
    const minAnchorY = safeTop - transformedBounds.minY * resolvedScale;
    const maxAnchorY = safeBottom - transformedBounds.maxY * resolvedScale;
    const resolvedX = clamp(preferredX, Math.min(minAnchorX, maxAnchorX), Math.max(minAnchorX, maxAnchorX));
    const resolvedY = clamp(preferredY, Math.min(minAnchorY, maxAnchorY), Math.max(minAnchorY, maxAnchorY));
    const screenBounds = {
      minX: resolvedX + transformedBounds.minX * resolvedScale,
      maxX: resolvedX + transformedBounds.maxX * resolvedScale,
      minY: resolvedY + transformedBounds.minY * resolvedScale,
      maxY: resolvedY + transformedBounds.maxY * resolvedScale
    };
    return {
      resolvedX,
      resolvedY,
      resolvedScale,
      transformedBounds,
      screenBounds,
      safeArea: { left: safeLeft, top: safeTop, right: safeRight, bottom: safeBottom },
      shiftedX: Math.abs(resolvedX - preferredX) > 0.001,
      shiftedY: Math.abs(resolvedY - preferredY) > 0.001,
      scaled: Math.abs(resolvedScale - naturalScale) > 0.001
    };
  }

  function buildPinSpecialQueue() {
    const grouped = {};
    const ungrouped = [];
    for (const type of PIN_SPECIAL_TYPES) {
      const group = animationSpec(type)?.exclusiveGroup || null;
      if (group) {
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(type);
      } else {
        ungrouped.push(type);
      }
    }
    const chosenFromGroups = Object.values(grouped).map(groupTypes => groupTypes[randInt(0, groupTypes.length - 1)]);
    return shuffled([...ungrouped, ...chosenFromGroups]);
  }

  function nextPinSpecialType() {
    if (!game.pinSpecialQueue || !game.pinSpecialQueue.length) game.pinSpecialQueue = buildPinSpecialQueue();
    return game.pinSpecialQueue.shift();
  }

  function validateSpecialAnimationRegistry() {
    const problems = [];
    for (const type of PIN_SPECIAL_TYPES) {
      const spec = animationSpec(type);
      if (!spec) problems.push(`${type}: missing registry entry`);
      if (spec && typeof spec.duration !== "function") problems.push(`${type}: missing duration function`);
      if (spec && typeof spec.draw !== "function") problems.push(`${type}: missing draw function`);
      if (spec && !["path", "staticTimed", "custom"].includes(spec.updateMode)) problems.push(`${type}: unknown updateMode ${spec.updateMode}`);
    }
    if (problems.length) console.warn("Meowmoon special animation registry warnings:", problems);
  }

  function assignSpecialPins() {
    game.pins.forEach(pin => {
      pin.specialType = nextPinSpecialType();
      pin.specialTriggered = false;
    });
    game.remainingSpecialPins = game.pins.length;
  }

  function assignSpecialBalls() {
    game.specialBallMap = {};
  }

  function generatePins() {
    const count = randInt(12, 16);
    const minSep = layout.pinH * 0.70;
    const pinSafeScale = 1.08;
    const left = layout.wallLeft + layout.pinW * pinSafeScale * 0.78;
    const right = layout.wallRight - layout.pinW * pinSafeScale * 0.78;
    const top = layout.playTop + layout.pinH * pinSafeScale * 0.60;
    const bottom = Math.max(top + 160, layout.playBottom - layout.pinH * pinSafeScale * 0.60);

    const anchors = [];
    const groupCount = randInt(7, 10);
    for (let i = 0; i < groupCount; i += 1) {
      anchors.push({ x: rand(left, right), y: rand(top, bottom) });
    }

    let attempts = 0;
    while (game.pins.length < count && attempts < 1500) {
      attempts += 1;
      const group = anchors[randInt(0, anchors.length - 1)];
      const mode = Math.random();
      let x = group.x + rand(-layout.pinH * 1.15, layout.pinH * 1.15);
      let y = group.y + rand(-layout.pinH * 0.90, layout.pinH * 0.90);
      if (mode < 0.22) {
        x = rand(left, right);
        y = rand(top, bottom);
      }
      x = clamp(x, left, right);
      y = clamp(y, top, bottom);

      const candidate = { x, y };
      const tooClose = game.pins.some(p => Math.hypot(p.x - x, p.y - y) < minSep * rand(0.82, 1.26));
      if (tooClose) continue;
      game.pins.push(createPin(x, y, game.pins.length));
    }

    // If the device is small and spacing prevented enough pins, fill with looser spacing.
    attempts = 0;
    while (game.pins.length < count && attempts < 1000) {
      attempts += 1;
      const x = rand(left, right);
      const y = rand(top, bottom);
      const tooClose = game.pins.some(p => Math.hypot(p.x - x, p.y - y) < minSep * 0.58);
      if (!tooClose) game.pins.push(createPin(x, y, game.pins.length));
    }

    for (const pin of game.pins) {
      pin.x = clamp(pin.x, left, right);
      pin.y = clamp(pin.y, top, bottom);
      pin.baseX = pin.x;
      pin.baseY = pin.y;
    }
  }

  function createPin(x, y, index) {
    return {
      id: `p${game.level}-${index}-${Math.random().toString(16).slice(2)}`,
      x,
      y,
      baseX: x,
      baseY: y,
      vx: 0,
      vy: 0,
      angle: rand(-0.025, 0.025),
      angularVelocity: 0,
      wobble: rand(0, TAU),
      fallen: false,
      falling: false,
      hitAt: 0,
      chainDepth: 0,
      scale: rand(0.94, 1.08),
      fading: false,
      fadeStartAt: 0,
      lifecycleStartedAt: 0,
      removed: false,
      rocket: null,
      specialType: null,
      specialTriggered: false
    };
  }

  function showStartOverlay() {
    if (!startOverlay) return;
    if (game.level === 1 && !game.introDismissed && game.phase === "title") {
      startOverlay.hidden = false;
      startOverlay.setAttribute("aria-hidden", "false");
    }
  }

  function hideStartOverlay() {
    if (!startOverlay) return;
    startOverlay.hidden = true;
    startOverlay.setAttribute("aria-hidden", "true");
  }

  function currentTitleAlpha(current) {
    return game.introDismissed ? 0 : 1;
  }

  function pointerToGame(evt) {
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  function pointInCat(p) {
    const s = layout.ballR * 0.84;
    return Math.hypot(p.x - layout.catX, p.y - (layout.catY - s * 0.26)) < s * 1.55;
  }

  function startRollFromPointerEvent(evt, reason = "pointerdown") {
    const p = pointerToGame(evt);
    ensureStartupReady(reason);

    if (game.phase === "paused") {
      resumeFromPause();
      return;
    }

    if (game.phase === "title") {
      game.introDismissed = true;
      hideStartOverlay();
      enterPlayingPhase(null, game.forceHitNext, "title-tap");
      audio.start();
      fireBall(p);
      return;
    }

    if (pointInCat(p)) {
      beginCatHold(p, evt.pointerId);
      return;
    }

    if (game.phase !== "playing" || game.ball) return;

    hideStartOverlay();
    audio.start();
    fireBall(p);
  }

  function onPointerDown(evt) {
    evt.preventDefault();
    startRollFromPointerEvent(evt, "canvas-pointerdown");
  }

  function onPointerMove(evt) {
    if (!game.hold) return;
    const p = pointerToGame(evt);
    if (!pointInCat(p)) cancelCatHold();
  }

  function onPointerUp(evt) {
    if (game.hold && game.hold.pointerId === evt.pointerId) cancelCatHold();
  }

  function beginCatHold(p, pointerId) {
    cancelCatHold();
    game.hold = { startedAt: nowMs(), pointerId };
    game.hold.timer = window.setTimeout(() => {
      game.hold = null;
      pauseGame("Meowmoon pause");
    }, LONG_PRESS_MS);
  }

  function cancelCatHold() {
    if (!game.hold) return;
    if (game.hold.timer) window.clearTimeout(game.hold.timer);
    game.hold = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("pointermove", onPointerMove, { passive: false });
  canvas.addEventListener("pointerup", onPointerUp, { passive: false });
  canvas.addEventListener("pointercancel", onPointerUp, { passive: false });
  if (startOverlay) {
    startOverlay.addEventListener("pointerdown", (evt) => {
      evt.preventDefault();
      startRollFromPointerEvent(evt, "start-overlay-pointerdown");
    }, { passive: false });
  }

  function scheduleAutoPause() {
    if (game.phase === "paused") return;
    if (game.pauseTimer) window.clearTimeout(game.pauseTimer);
    game.pauseTimer = window.setTimeout(() => pauseGame("automatic pause"), AUTO_PAUSE_GRACE_MS);
  }

  function clearAutoPause() {
    if (game.pauseTimer) window.clearTimeout(game.pauseTimer);
    game.pauseTimer = null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) scheduleAutoPause();
    else clearAutoPause();
  });
  window.addEventListener("blur", scheduleAutoPause, { passive: true });
  window.addEventListener("focus", clearAutoPause, { passive: true });
  window.addEventListener("pagehide", scheduleAutoPause, { passive: true });

  function pauseGame(reason) {
    enterPausedPhase(reason || "pause");
  }

  function resumeFromPause() {
    if (game.phase !== "paused") return;
    const pausedDuration = nowMs() - game.pausedAt;
    // Shift timers forward so animations do not jump.
    game.titleStartedAt += pausedDuration;
    game.rewardStartedAt += pausedDuration;
    game.nextLevelAt += pausedDuration;
    for (const p of game.particles) p.startedAt += pausedDuration;
    for (const pin of game.pins) {
      pin.hitAt += pausedDuration;
      if (pin.fadeStartAt) pin.fadeStartAt += pausedDuration;
      if (pin.rocket) {
        ["startedAt", "burstAt", "popAt", "meltAt", "swipeAt", "finishAt", "nextChug"].forEach(key => { if (pin.rocket[key]) pin.rocket[key] += pausedDuration; });
      }
    }
    resumePhaseAfterPause();
    audio.resumeMusic();
    if (game.ball) audio.startRolling();
    if (game.pins.some(pin => pin.rocket && !pin.removed && (pin.rocket.type === "rocket" || pin.rocket.type === "firework"))) audio.startRocketFlight();
  }

  // =====================================================
  // PHASE STATE HELPERS
  // =====================================================
  // These helpers centralize phase transitions so the game is less likely to
  // enter inconsistent states such as "rolling without a ball" or "playing with
  // a stale ball". They are intended to preserve existing behavior.
  function setGamePhase(nextPhase, reason = "") {
    game.phase = nextPhase;
    game.phaseChangedAt = nowMs();
    game.phaseChangeReason = reason;
  }

  function clearBallAndPath() {
    game.ball = null;
    game.pathPreview = [];
    audio.stopRolling();
  }

  function enterPlayingPhase(message = null, forceHitNext = game.forceHitNext, reason = "enter-playing") {
    clearBallAndPath();
    game.resolvingStartedAt = 0;
    game.resolvingUntil = 0;
    game.forceHitNext = forceHitNext;
    if (message !== null) game.message = message;
    setGamePhase("playing", reason);
  }

  function enterRollingPhase(ball, path, reason = "enter-rolling") {
    hideStartOverlay();
    if (!ball || !Array.isArray(ball.path) || ball.path.length < 2) {
      console.warn("Phase-state safety: refused to enter rolling with an invalid ball.");
      enterPlayingPhase(null, true, "invalid-ball-to-playing");
      return;
    }
    game.ball = ball;
    game.pathPreview = path || ball.path || [];
    game.resolvingStartedAt = 0;
    game.resolvingUntil = 0;
    setGamePhase("rolling", reason);
    audio.startRolling();
  }

  function enterResolvingPhase(resolveUntil, message = null, reason = "enter-resolving") {
    clearBallAndPath();
    game.forceHitNext = false;
    game.resolvingStartedAt = nowMs();
    game.resolvingUntil = Number.isFinite(resolveUntil) ? resolveUntil : game.resolvingStartedAt + 700;
    if (message !== null) game.message = message;
    setGamePhase("resolving", reason);
  }

  function enterRewardPhase(reason = "enter-reward") {
    hideStartOverlay();
    if (game.phase === "reward") return false;
    clearBallAndPath();
    game.resolvingStartedAt = 0;
    game.resolvingUntil = 0;
    game.rewardStartedAt = nowMs();
    game.nextLevelAt = game.rewardStartedAt + LEVEL_REWARD_MS + NEXT_LEVEL_DELAY_MS;
    setGamePhase("reward", reason);
    audio.stopRocketFlight();
    return true;
  }

  function enterPausedPhase(reason = "pause") {
    if (game.phase === "paused") return;
    clearAutoPause();
    cancelCatHold();
    game.previousPhase = game.phase === "title" ? "playing" : game.phase;
    setGamePhase("paused", reason);
    game.pausedAt = nowMs();
    audio.pauseMusic();
  }

  function resumePhaseAfterPause() {
    const restoredPhase = game.previousPhase === "title" ? "playing" : (game.previousPhase || "playing");
    setGamePhase(restoredPhase, "resume-from-pause");
    if (game.phase === "rolling" && !game.ball) enterPlayingPhase(null, game.forceHitNext, "resume-rolling-without-ball");
  }

  function validatePhaseState(current) {
    if (game.phase === "rolling" && !game.ball) {
      console.warn("Phase-state safety: rolling without ball; returning to playing.");
      enterPlayingPhase(null, game.forceHitNext, "rolling-without-ball");
      return;
    }
    if (game.phase === "rolling" && game.ball && (!Array.isArray(game.ball.path) || game.ball.path.length < 2)) {
      console.warn("Phase-state safety: rolling with invalid ball path; returning to playing.");
      enterPlayingPhase("Good try!\nThe next roll will help.", true, "rolling-invalid-ball-path");
      return;
    }
    if (game.phase === "resolving" && game.ball) {
      console.warn("Phase-state safety: resolving with stale ball; clearing ball.");
      clearBallAndPath();
    }
    if ((game.phase === "playing" || game.phase === "reward") && game.ball) {
      console.warn("Phase-state safety: non-rolling phase with stale ball; clearing ball.");
      clearBallAndPath();
    }
    if (game.phase === "playing" && remainingUprightCount() === 0 && game.pins.length > 0) {
      beginReward();
    }
  }

  function ensureStartupReady(reason = "startup") {
    if (!game.message) game.message = messages[0];

    // If startup somehow reaches input/rendering before the first level is valid,
    // rebuild only the first opening state. Do not interfere with later reward
    // moments where pins may legitimately be clearing between levels.
    const openingIsIncomplete =
      game.level <= 0 ||
      (game.level === 1 && !game.introDismissed && (!Array.isArray(game.pins) || game.pins.length === 0));

    if (openingIsIncomplete) {
      console.warn(`Startup readiness safety rebuilt opening level: ${reason}`);
      game.level = 0;
      game.introDismissed = false;
      game.message = messages[0];
      startLevel();
      return true;
    }

    if (game.level === 1 && !game.introDismissed && game.phase !== "title") {
      setGamePhase("title", `startup-title-repair-${reason}`);
    }

    if (game.phase === "title") {
      game.message = messages[0];
      showStartOverlay();
    } else {
      hideStartOverlay();
    }

    return false;
  }

  function fireBall(tap) {
    const nextRoll = game.rollsThisLevel + 1;
    const targetInfo = chooseAssistedTarget(tap, nextRoll);
    if (!targetInfo) return;
    game.pathPreview = targetInfo.path;
    const specialType = null;
    game.rollsThisLevel = nextRoll;
    const ballRadius = layout.ballR;
    const ball = {
      x: layout.rollerX,
      y: layout.rollerY - layout.ballR * 0.55,
      r: ballRadius,
      path: targetInfo.path,
      segment: 0,
      distanceOnSegment: 0,
      targetPinId: targetInfo.pin ? targetInfo.pin.id : null,
      guaranteed: targetInfo.guaranteed,
      spin: 0,
      missed: false,
      colorSeed: game.nextBallSeed++,
      specialType,
      trail: [],
      bounceCount: 0,
      squashUntil: 0,
      launchedAt: nowMs()
    };
    enterRollingPhase(ball, targetInfo.path, "fire-ball");
  }

  function chooseAssistedTarget(tap, nextRoll = game.rollsThisLevel + 1) {
    const start = { x: layout.rollerX, y: layout.rollerY - layout.ballR * 0.55 };
    const uprightPins = game.pins.filter(p => !p.fallen && !p.falling && !p.rocket && !p.removed);
    if (!uprightPins.length) return null;

    const rawAngle = Math.atan2(tap.y - start.y, tap.x - start.x);
    const scored = [];

    for (const pin of uprightPins) {
      const aimPoint = { x: pin.x, y: pin.y + layout.pinH * 0.16 };
      const options = pathOptionsTo(start, aimPoint);
      for (const opt of options) {
        const targetCloseness = Math.hypot(tap.x - aimPoint.x, tap.y - aimPoint.y) / Math.max(320, view.h);
        const angleScore = angleDistance(rawAngle, opt.initialAngle);
        const nearEdgeBonus = (pin.x < view.w * 0.17 || pin.x > view.w * 0.83) && opt.bounce ? -0.04 : 0;
        const guaranteedBonus = (game.forceHitNext || nextRoll >= MAX_ROLLS_PER_LEVEL) ? -0.85 : 0;
        const clusterCount = uprightPins.filter(other => other !== pin && Math.hypot(other.x - pin.x, other.y - pin.y) < layout.pinH * 1.55).length;
        const specialBonus = pin.specialType ? -0.16 : 0;
        const score = angleScore + targetCloseness * 0.44 + (opt.bounce ? 0.055 : 0) + nearEdgeBonus + guaranteedBonus - clusterCount * 0.06 + specialBonus;
        scored.push({ pin, path: opt.points, score, guaranteed: (game.forceHitNext || nextRoll >= MAX_ROLLS_PER_LEVEL) });
      }
    }

    scored.sort((a, b) => a.score - b.score);
    const best = scored[0];

    // If the child clearly aims at empty sky and the previous roll was not a miss,
    // allow a gentle miss sometimes. The next roll is then forced to be a hit.
    const nearestPinDist = Math.min(...uprightPins.map(pin => Math.hypot(tap.x - pin.x, tap.y - pin.y)));
    const emptySkyTap = nearestPinDist > layout.pinH * 2.7 && !game.forceHitNext && nextRoll < MAX_ROLLS_PER_LEVEL;
    if (emptySkyTap && Math.random() < 0.10) {
      const missPath = missPathForTap(start, tap);
      return { pin: null, path: missPath, guaranteed: false };
    }

    return best;
  }

  function pathOptionsTo(start, point) {
    const options = [];
    const directAngle = Math.atan2(point.y - start.y, point.x - start.x);
    options.push({ points: [start, point], initialAngle: directAngle, bounce: false });

    const walls = [layout.wallLeft, layout.wallRight];
    for (const wallX of walls) {
      const mirrorX = wallX === layout.wallLeft ? (wallX * 2 - point.x) : (wallX * 2 - point.x);
      const mirror = { x: mirrorX, y: point.y };
      const denom = mirror.x - start.x;
      if (Math.abs(denom) < 1) continue;
      const t = (wallX - start.x) / denom;
      const bounceY = start.y + (mirror.y - start.y) * t;
      if (t > 0.06 && t < 0.94 && bounceY > layout.playTop - layout.pinH && bounceY < start.y - layout.ballR * 1.8) {
        const bounce = { x: wallX, y: bounceY };
        const initialAngle = Math.atan2(bounce.y - start.y, bounce.x - start.x);
        options.push({ points: [start, bounce, point], initialAngle, bounce: true });
      }
    }
    return options;
  }

  function missPathForTap(start, tap) {
    let angle = Math.atan2(tap.y - start.y, tap.x - start.x);
    // Keep shots generally upward.
    angle = clamp(angle, -Math.PI * 0.93, -Math.PI * 0.07);
    const end = projectedEdgePoint(start, angle);
    return [start, end];
  }

  function projectedEdgePoint(start, angle) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const candidates = [];
    if (dx < -0.001) candidates.push((layout.wallLeft - start.x) / dx);
    if (dx > 0.001) candidates.push((layout.wallRight - start.x) / dx);
    if (dy < -0.001) candidates.push((layout.playTop - layout.pinH * 1.2 - start.y) / dy);
    const t = Math.min(...candidates.filter(v => v > 20));
    return { x: start.x + dx * t, y: start.y + dy * t };
  }

  function update(current) {
    if (game.phase === "paused") return;
    const dt = clamp((current - lastFrame) / 1000, 0, 0.035);
    updateBall(dt);
    updatePins(current, dt);
    updateParticles(current, dt);
    updateReward(current);
    validatePhaseState(current);
  }

  function updateBall(dt) {
    if (!game.ball || game.phase !== "rolling") return;
    const ball = game.ball;
    const currentTime = nowMs();
    if (!Array.isArray(ball.path) || ball.path.length < 2 || currentTime - (ball.launchedAt || currentTime) > MAX_BALL_ROLL_MS) {
      console.warn("Ball lifecycle safety cleanup: resolving invalid or overlong roll.");
      resolveMiss();
      return;
    }
    ball.spin += dt * 7.5;
    ball.trail.push({ x: ball.x, y: ball.y, at: currentTime });
    if (ball.trail.length > 28) ball.trail.shift();
    let remaining = BALL_SPEED * dt;

    while (remaining > 0 && ball.segment < ball.path.length - 1) {
      const a = ball.path[ball.segment];
      const b = ball.path[ball.segment + 1];
      const segmentLength = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const left = segmentLength - ball.distanceOnSegment;
      const step = Math.min(left, remaining);
      ball.distanceOnSegment += step;
      remaining -= step;
      const t = ball.distanceOnSegment / segmentLength;
      ball.x = lerp(a.x, b.x, t);
      ball.y = lerp(a.y, b.y, t);

      const hitPin = detectBallPinHit(ball);
      if (hitPin) {
        resolveBallHit(hitPin);
        return;
      }

      if (ball.distanceOnSegment >= segmentLength - 0.5) {
        if (ball.segment + 1 < ball.path.length - 1) {
          ball.bounceCount += 1;
          ball.squashUntil = currentTime + 180;
          if (ball.specialType === "superbounce") makeWallBounceBurst(b.x, b.y);
        }
        ball.segment += 1;
        ball.distanceOnSegment = 0;
        ball.x = b.x;
        ball.y = b.y;
      }
    }

    if (ball.segment >= ball.path.length - 1) {
      const target = ball.targetPinId ? game.pins.find(p => p.id === ball.targetPinId && !p.fallen && !p.falling) : null;
      const fallback = game.pins.filter(p => !p.fallen && !p.falling && !p.rocket && !p.removed).sort((a,b)=>Math.hypot(ball.x-a.x,ball.y-a.y)-Math.hypot(ball.x-b.x,ball.y-b.y))[0] || null;
      if ((target && ball.guaranteed) || (game.rollsThisLevel >= MAX_ROLLS_PER_LEVEL && fallback)) {
        resolveBallHit(target || fallback);
      } else {
        resolveMiss();
      }
    }
  }

  function detectBallPinHit(ball) {
    for (const pin of game.pins) {
      if (pin.fallen || pin.falling || pin.rocket || pin.removed) continue;
      const hitRadius = ball.r * 0.78 + layout.pinW * 0.62;
      const targetPoint = { x: pin.x, y: pin.y + layout.pinH * 0.10 };
      if (Math.hypot(ball.x - targetPoint.x, ball.y - targetPoint.y) <= hitRadius) return pin;
    }
    return null;
  }

  function resolveBallHit(pin) {
    if (!pin || pin.removed || pin.fallen || pin.falling || pin.rocket) {
      console.warn("Ball hit lifecycle safety cleanup: invalid target pin.");
      resolveMiss();
      return;
    }
    audio.stopRolling();
    const ballSpecial = game.ball ? game.ball.specialType : null;
    const forceClearAll = game.rollsThisLevel >= MAX_ROLLS_PER_LEVEL;
    const knocked = knockPinsFrom(pin, ballSpecial, forceClearAll);
    if (!knocked.length) {
      console.warn("Ball hit lifecycle safety cleanup: no pins were knocked.");
      resolveMiss();
      return;
    }
    const specialHit = knocked.some(p => p.rocket);
    const resolvingMessage = messages[(++game.messageIndex) % messages.length];
    audio.hitPins(knocked.length);
    if (!specialHit) audio.pinFall(knocked.length);
    makeImpactParticles(pin.x, pin.y, knocked.length);
    if (ballSpecial === "meteor") makeMeteorImpact(pin.x, pin.y);
    if (ballSpecial === "giantbounce") makePinataBurst(pin.x, pin.y);
    const longestSpecial = knocked.reduce((m, p) => Math.max(m, p.rocket ? ((p.rocket.finishAt || (p.rocket.startedAt + p.rocket.duration)) - nowMs()) : 0), 0);
    const safeLongestSpecial = Number.isFinite(longestSpecial) ? longestSpecial : 700;
    const resolvingUntil = nowMs() + (specialHit ? Math.max(700, safeLongestSpecial + 160) : PIN_FADE_DELAY_MS + PIN_FADE_MS + 160);
    enterResolvingPhase(resolvingUntil, resolvingMessage, "ball-hit");
  }

  function resolveMiss() {
    enterPlayingPhase("Good try!\nThe next roll will help.", true, "miss");
  }

  function knockPinsFrom(firstPin, ballSpecial = null, forceClearAll = false) {
    const remainingBefore = remainingUprightCount();
    const knocked = [];
    const openingPower = ballSpecial === "giantbounce" ? 1.6 : ballSpecial === "meteor" ? 1.25 : 1;
    const queue = [{ pin: firstPin, depth: 0, power: openingPower }];
    const seen = new Set();
    const current = nowMs();

    while (queue.length) {
      const item = queue.shift();
      const pin = item.pin;
      if (!pin || seen.has(pin.id) || pin.fallen || pin.falling || pin.rocket || pin.removed) continue;
      seen.add(pin.id);
      if (item.depth === 0 && pin.specialType && !pin.specialTriggered) {
        launchSpecialPin(pin, current, pin.specialType);
        pin.specialTriggered = true;
        game.remainingSpecialPins = Math.max(0, game.remainingSpecialPins - 1);
        knocked.push(pin);
        if (ballSpecial === "giantbounce" || forceClearAll) {
          const extraNeighbors = game.pins.filter(p => !p.fallen && !p.falling && !p.rocket && !p.removed && !seen.has(p.id))
            .map(p => ({ pin: p, d: Math.hypot(p.x - pin.x, p.y - pin.y) }))
            .filter(o => o.d < layout.pinH * 1.9)
            .sort((a,b)=>a.d-b.d)
            .slice(0, 2);
          extraNeighbors.forEach(n => queue.push({ pin: n.pin, depth: 1, power: 0.95 }));
        }
        continue;
      }
      knockOnePin(pin, item.depth, item.power, current);
      knocked.push(pin);

      const neighbors = game.pins
        .filter(p => !p.fallen && !p.falling && !p.rocket && !p.removed && !seen.has(p.id))
        .map(p => ({ pin: p, d: Math.hypot(p.x - pin.x, p.y - pin.y) }))
        .filter(o => o.d < layout.pinH * (item.depth === 0 ? 1.45 : 1.15))
        .sort((a, b) => a.d - b.d);

      for (const n of neighbors) {
        const baseChance = item.depth === 0 ? 0.72 : 0.46;
        const distanceFactor = clamp(1 - n.d / (layout.pinH * 1.85), 0, 1);
        const chance = clamp(baseChance * (0.52 + distanceFactor) * item.power, 0, 0.95);
        if (Math.random() < chance) {
          queue.push({ pin: n.pin, depth: item.depth + 1, power: item.power * 0.80 });
        }
      }
    }

    if (ballSpecial === "giantbounce") {
      const extras = game.pins.filter(p => !p.fallen && !p.falling && !p.rocket && !p.removed && !seen.has(p.id))
        .sort((a,b)=>Math.hypot(a.x-firstPin.x,a.y-firstPin.y)-Math.hypot(b.x-firstPin.x,b.y-firstPin.y)).slice(0,2);
      extras.forEach(pin => { knockOnePin(pin, 1, 1.0, current); knocked.push(pin); seen.add(pin.id); });
    }

    if (forceClearAll) {
      for (const pin of game.pins) {
        if (seen.has(pin.id) || pin.fallen || pin.falling || pin.rocket || pin.removed) continue;
        if (pin.specialType && !pin.specialTriggered) {
          launchSpecialPin(pin, current, pin.specialType);
          pin.specialTriggered = true;
          game.remainingSpecialPins = Math.max(0, game.remainingSpecialPins - 1);
          knocked.push(pin);
        } else {
          knockOnePin(pin, 1, 1.05, current);
          knocked.push(pin);
        }
      }
    }

    return knocked;
  }

  function launchSpecialPin(pin, current, forcedType = null) {
    const type = forcedType || pin.specialType || PIN_SPECIAL_TYPES[randInt(0, PIN_SPECIAL_TYPES.length - 1)];
    pin.falling = false;
    pin.fallen = true;
    pin.fading = false;
    pin.fadeStartAt = 0;
    pin.lifecycleStartedAt = current;
    pin.vx = 0;
    pin.vy = 0;
    pin.angularVelocity = 0;
    const duration = animationDuration(type);
    const exitSide = Math.random() < 0.5 ? -1 : 1;
    const exitX = exitSide < 0 ? -layout.pinH * 1.2 : view.w + layout.pinH * 1.2;
    const exitY = rand(layout.playTop + layout.pinH * 0.2, layout.playBottom - layout.pinH * 0.4);
    const deterministicVariantCount = type === "yellowchickhatch" ? 3
      : type === "babystegosaurushatch" ? 2
      : type === "kangaroopouchsurprise" ? 2
      : type === "wombatburrowbuilder" ? 3
      : 0;
    const variant = deterministicVariantCount
      ? Math.abs((game.rollsThisLevel || 0) + (Number(pin.id) || 0)) % deterministicVariantCount
      : randInt(0, 9999);
    pin.rocket = {
      type, variant, startedAt: current, duration,
      burstAt: current + duration * rand(0.45, 0.82),
      popAt: current + duration * rand(0.70, 0.88),
      meltAt: current + duration * rand(0.62, 0.82),
      swipeAt: current + duration * rand(0.30, 0.52),
      finishAt: current + duration, burstDone: false, pawDone: false, popped: false,
      balloonColor: ["#ff6fae", "#7bdfff", "#ffe36d", "#9d7bff", "#63e38c"][randInt(0,4)],
      jellyColor: ["#ff88c2", "#8ee0ff", "#a7ff7d", "#ffe36d", "#b59aff"][randInt(0,4)],
      pawSide: Math.random() < 0.5 ? -1 : 1,
      petalColor: ["#ff7fb9", "#ffd75f", "#8ee0ff", "#c6a6ff", "#84e56d"][randInt(0,4)],
      paintColor: ["#ff4d6d", "#ffaa33", "#41d6ff", "#8a5cff", "#5fd36a"][randInt(0,4)],
      animalColor: ["#f6c36b", "#8be37e", "#66d4ff", "#ffd96b", "#9ab6ff", "#d69c6a"][randInt(0,5)],
      exit: { x: exitX, y: exitY },
      path: [
        { x: pin.x, y: pin.y },
        { x: rand(layout.wallLeft + layout.pinH * 0.4, layout.wallRight - layout.pinH * 0.4), y: rand(layout.playTop + layout.pinH * 0.2, layout.playBottom - layout.pinH * 0.8) },
        { x: rand(layout.wallLeft + layout.pinH * 0.4, layout.wallRight - layout.pinH * 0.4), y: rand(layout.playTop + layout.pinH * 0.2, layout.playBottom - layout.pinH * 0.8) },
        { x: exitX, y: exitY }
      ]
    };
    if (type === "firework") {
      const burstX = rand(layout.wallLeft + layout.pinH * 0.7, layout.wallRight - layout.pinH * 0.7);
      const burstY = rand(layout.playTop + layout.pinH * 0.25, layout.playTop + layout.pinH * 1.4);
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: lerp(pin.x, burstX, 0.35), y: lerp(pin.y, burstY, 0.55) }, { x: burstX, y: burstY }, { x: burstX, y: burstY - layout.pinH * 0.12 }];
      audio.fireworkLaunch();
    } else if (type === "rocket") {
      audio.rocketLaunch();
      makeRocketTrailParticles(pin.x, pin.y, 14);
    } else if (type === "pinata") {
      audio.pinataBurst();
    } else if (type === "pinatastar") {
      audio.pinataBurst();
    } else if (type === "balloon") {
      audio.balloonInflate();
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: pin.x + rand(-layout.pinH * 0.45, layout.pinH * 0.45), y: pin.y - layout.pinH * rand(1.2, 2.2) }, { x: pin.x + rand(-layout.pinH * 0.85, layout.pinH * 0.85), y: layout.playTop - layout.pinH * 0.4 }, { x: pin.x + rand(-layout.pinH, layout.pinH), y: -layout.pinH * 1.2 }];
    } else if (type === "jelly") {
      audio.jellyWobble();
    } else if (type === "catpaw") {
      audio.catPawSwipe();
      pin.rocket.exit = { x: exitSide < 0 ? -layout.pinH * 1.5 : view.w + layout.pinH * 1.5, y: pin.y + rand(-layout.pinH * 0.2, layout.pinH * 0.15) };
    } else if (type === "toytrain") {
      audio.toyTrainStart();
      pin.rocket.nextChug = current + 260;
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: layout.wallLeft + layout.pinH * 0.8, y: pin.y + rand(-layout.pinH * 0.2, layout.pinH * 0.2) }, { x: layout.wallRight - layout.pinH * 0.8, y: pin.y + rand(-layout.pinH * 0.25, layout.pinH * 0.25) }, { x: exitX, y: pin.y + rand(-layout.pinH * 0.3, layout.pinH * 0.3) }];
    } else if (type === "popcorn") {
      audio.popcornCluster();
      pin.rocket.popAt = current + pin.rocket.duration * rand(0.26, 0.34);
    } else if (type === "kite") {
      audio.kiteWhoosh();
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: pin.x + rand(-layout.pinH * 0.8, layout.pinH * 0.8), y: pin.y - layout.pinH * 1.6 }, { x: pin.x + rand(-layout.pinH * 1.2, layout.pinH * 1.2), y: layout.playTop - layout.pinH * 0.1 }, { x: pin.x + rand(-layout.pinH * 1.4, layout.pinH * 1.4), y: -layout.pinH * 1.0 }];
    } else if (type === "magicpaint") {
      audio.brushSwish();
    } else if (type === "flower") {
      audio.flowerBloom();
    } else if (type === "racecar") {
      audio.raceCarRev();
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: layout.wallLeft + layout.pinH * 0.5, y: pin.y + rand(-layout.pinH * 0.18, layout.pinH * 0.18) }, { x: layout.wallRight - layout.pinH * 0.6, y: pin.y + rand(-layout.pinH * 0.22, layout.pinH * 0.22) }, { x: exitX, y: pin.y + rand(-layout.pinH * 0.18, layout.pinH * 0.18) }];
    } else if (type === "airplane") {
      audio.airplaneTakeoff();
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: pin.x + rand(-layout.pinH * 0.6, layout.pinH * 0.6), y: pin.y - layout.pinH * 1.2 }, { x: pin.x + rand(-layout.pinH * 1.4, layout.pinH * 1.4), y: layout.playTop + layout.pinH * 0.35 }, { x: exitX, y: layout.playTop - layout.pinH * 0.7 }];
    } else if (type === "helicopter") {
      audio.helicopterStart();
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: pin.x + rand(-layout.pinH * 0.7, layout.pinH * 0.7), y: pin.y - layout.pinH * 0.9 }, { x: rand(layout.wallLeft + layout.pinH * 0.6, layout.wallRight - layout.pinH * 0.6), y: rand(layout.playTop + layout.pinH * 0.6, layout.playTop + layout.pinH * 2.1) }, { x: exitX, y: rand(layout.playTop + layout.pinH * 0.2, layout.playTop + layout.pinH * 1.3) }];
    } else if (type === "bus") {
      audio.busHorn();
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: layout.wallLeft + layout.pinH * 0.55, y: pin.y + rand(-layout.pinH * 0.14, layout.pinH * 0.14) }, { x: layout.wallRight - layout.pinH * 0.55, y: pin.y + rand(-layout.pinH * 0.14, layout.pinH * 0.14) }, { x: exitX, y: pin.y + rand(-layout.pinH * 0.18, layout.pinH * 0.18) }];
    } else if (type === "bulldozer") {
      audio.bulldozerRumble();
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: layout.wallLeft + layout.pinH * 0.5, y: pin.y + rand(-layout.pinH * 0.16, layout.pinH * 0.16) }, { x: layout.wallRight - layout.pinH * 0.6, y: pin.y + rand(-layout.pinH * 0.16, layout.pinH * 0.16) }, { x: exitX, y: pin.y + rand(-layout.pinH * 0.12, layout.pinH * 0.12) }];
    } else if (type === "bunny") {
      audio.bunnyHop();
      pin.rocket.nextChug = current + 320;
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: pin.x + rand(-layout.pinH * 0.5, layout.pinH * 0.5), y: pin.y - layout.pinH * 0.9 }, { x: pin.x + rand(-layout.pinH * 1.0, layout.pinH * 1.0), y: pin.y - layout.pinH * 0.2 }, { x: exitX, y: pin.y + rand(-layout.pinH * 0.25, layout.pinH * 0.15) }];
    } else if (type === "frog") {
      audio.frogBoing();
      pin.rocket.nextChug = current + 420;
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: pin.x + rand(-layout.pinH * 0.3, layout.pinH * 0.3), y: pin.y - layout.pinH * 0.4 }, { x: pin.x + rand(-layout.pinH * 0.9, layout.pinH * 0.9), y: pin.y - layout.pinH * 1.0 }, { x: exitX, y: pin.y + rand(-layout.pinH * 0.18, layout.pinH * 0.15) }];
    } else if (type === "bird") {
      audio.birdChirp();
      pin.rocket.nextChug = current + 280;
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: pin.x + rand(-layout.pinH * 0.5, layout.pinH * 0.5), y: pin.y - layout.pinH * 0.8 }, { x: rand(layout.wallLeft + layout.pinH * 0.5, layout.wallRight - layout.pinH * 0.5), y: layout.playTop + rand(layout.pinH * 0.3, layout.pinH * 1.8) }, { x: exitX, y: layout.playTop - layout.pinH * 0.4 }];
    } else if (["wheelchairhumanA", "wheelchairhumanB", "regularwheelchair"].includes(type)) {
      audio.raceCarRev();
      pin.rocket.nextChug = current + 460;
    } else if (type === "vanlift") {
      audio.busHorn();
    } else if (type === "marblerun") {
      pin.rocket.nextChug = current + 980;
    } else if (type === "giraffewalk") {
      pin.rocket.nextChug = current + 520;
    } else if (type === "elephantwave") {
      pin.rocket.nextChug = current + 580;
      audio.busDrive();
    } else if (type === "dandelionlife") {
      audio.flowerBloom();
    } else if (type === "firetruck") {
      audio.busHorn();
    } else if (type === "dogzoomies") {
      audio.dogZoomies();
      pin.rocket.nextChug = current + 260;
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: rand(layout.wallLeft + layout.pinH * 0.4, layout.wallRight - layout.pinH * 0.4), y: rand(layout.playTop + layout.pinH * 0.5, layout.playBottom - layout.pinH * 1.1) }, { x: rand(layout.wallLeft + layout.pinH * 0.4, layout.wallRight - layout.pinH * 0.4), y: rand(layout.playTop + layout.pinH * 0.5, layout.playBottom - layout.pinH * 1.1) }, { x: exitX, y: rand(layout.playTop + layout.pinH * 0.6, layout.playBottom - layout.pinH * 1.0) }];
    } else if (["batbaseball", "hockeypuck", "footballthrow", "soccergoal", "golfdrive", "baseballcatch", "bowlingstrike", "basketballhoop"].includes(type)) {
      pin.rocket.nextChug = current + 360;
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: pin.x + rand(-layout.pinH * 0.45, layout.pinH * 0.45), y: pin.y - layout.pinH * 0.55 }, { x: rand(layout.wallLeft + layout.pinH * 0.6, layout.wallRight - layout.pinH * 0.6), y: rand(layout.playTop + layout.pinH * 0.45, layout.playBottom - layout.pinH * 1.1) }, { x: exitX, y: rand(layout.playTop + layout.pinH * 0.5, layout.playBottom - layout.pinH * 0.9) }];
    } else if (type === "basketballdribble") {
      pin.rocket.nextChug = current + 250;
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: pin.x + rand(-layout.pinH * 0.4, layout.pinH * 0.4), y: pin.y + layout.pinH * 0.10 }, { x: rand(layout.wallLeft + layout.pinH * 0.8, layout.wallRight - layout.pinH * 0.8), y: pin.y + rand(-layout.pinH * 0.3, layout.pinH * 0.3) }, { x: exitX, y: pin.y + rand(-layout.pinH * 0.35, layout.pinH * 0.35) }];
    } else if (type === "curling") {
      pin.rocket.nextChug = current + 300;
      pin.rocket.path = [{ x: pin.x, y: pin.y }, { x: layout.wallLeft + layout.pinH * 0.75, y: pin.y + rand(-layout.pinH * 0.10, layout.pinH * 0.10) }, { x: layout.wallRight - layout.pinH * 0.75, y: pin.y + rand(-layout.pinH * 0.10, layout.pinH * 0.10) }, { x: exitX, y: pin.y + rand(-layout.pinH * 0.10, layout.pinH * 0.10) }];
    }
  }

  function knockOnePin(pin, depth, power, current) {
    pin.falling = true;
    pin.lifecycleStartedAt = current;
    pin.hitAt = current + depth * 70;
    const direction = Math.random() < 0.5 ? -1 : 1;
    pin.vx = direction * rand(18, 50) * power;
    pin.vy = rand(-12, 18) * power;
    pin.angularVelocity = direction * rand(1.6, 2.8) * (0.8 + power);
    pin.chainDepth = depth;
  }

  function markPinRemoved(pin, reason = "") {
    if (!pin) return;
    pin.removed = true;
    pin.falling = false;
    pin.fading = false;
    pin.rocket = null;
    pin.vx = 0;
    pin.vy = 0;
    pin.angularVelocity = 0;
    if (reason) pin.lastRemovalReason = reason;
  }

  function repairPinLifecycle(pin, current) {
    if (!pin || pin.removed) return;

    if (pin.rocket) {
      const s = pin.rocket;
      const finishAt = Number.isFinite(s.finishAt) ? s.finishAt : (s.startedAt || current) + (s.duration || 0);
      if (!Number.isFinite(s.duration) || s.duration <= 0 || current > finishAt + SPECIAL_ANIMATION_GRACE_MS) {
        markPinRemoved(pin, "expired-special");
      }
      return;
    }

    if (pin.falling && pin.lifecycleStartedAt && current - pin.lifecycleStartedAt > MAX_FALLING_PIN_MS) {
      pin.falling = false;
      pin.fallen = true;
      pin.vx = 0;
      pin.vy = 0;
      pin.angularVelocity = 0;
      pin.fading = true;
      pin.fadeStartAt = current;
      pin.lastRemovalReason = "falling-timeout";
      return;
    }

    if (pin.fading && pin.fadeStartAt && current - pin.fadeStartAt > PIN_FADE_MS + PIN_CLEANUP_GRACE_MS) {
      markPinRemoved(pin, "fade-timeout");
      return;
    }

    if (pin.fallen && !pin.fading && !pin.rocket && pin.lifecycleStartedAt && current - pin.lifecycleStartedAt > MAX_FALLING_PIN_MS) {
      pin.fading = true;
      pin.fadeStartAt = current;
      pin.lastRemovalReason = "fallen-no-fade-timeout";
    }
  }

  function clearLingeringResolvedPins() {
    for (const pin of game.pins) {
      if (pin.rocket || pin.fallen || pin.fading || pin.falling) markPinRemoved(pin, "level-complete-cleanup");
    }
    game.pins = game.pins.filter(pin => !pin.removed);
  }

  function updatePins(current, dt) {
    let activeFlightSpecials = false;
    for (const pin of game.pins) {
      if (pin.rocket && !pin.removed) {
        if (pin.rocket.type === "rocket" || pin.rocket.type === "firework") activeFlightSpecials = true;
        try {
          updateSpecialPin(pin, current, dt);
        } catch (err) {
          console.error("Special animation update failed; removing pin safely.", pin.rocket?.type, err);
          markPinRemoved(pin, "special-update-error");
        }
        repairPinLifecycle(pin, current);
        continue;
      }
      repairPinLifecycle(pin, current);
      if (pin.removed) continue;
      if (pin.fading && current - pin.fadeStartAt >= PIN_FADE_MS) {
        pin.removed = true;
        continue;
      }
      if (!pin.falling) continue;
      if (current < pin.hitAt) continue;
      pin.x += pin.vx * dt;
      pin.y += pin.vy * dt;
      pin.vy += 80 * dt;
      pin.angle += pin.angularVelocity * dt;
      const targetAngle = pin.angularVelocity >= 0 ? Math.PI * 0.53 : -Math.PI * 0.53;
      if (Math.abs(pin.angle) >= Math.abs(targetAngle)) {
        pin.angle = targetAngle;
        pin.falling = false;
        pin.fallen = true;
        pin.vx *= 0.22;
        pin.vy = 0;
        pin.fading = true;
        pin.fadeStartAt = current + PIN_FADE_DELAY_MS;
      }
    }
    if (!activeFlightSpecials) audio.stopRocketFlight();
    game.pins = game.pins.filter(pin => !pin.removed);
  }

  function updateSpecialPin(pin, current, dt) {
    const s = pin.rocket;
    if (!s) return;
    if (!Number.isFinite(s.duration) || s.duration <= 0) { pin.removed = true; return; }
    const age = current - s.startedAt;
    const t = clamp(age / s.duration, 0, 1);

    if (animationUpdateMode(s.type) === "staticTimed") {
      if (s.type === "wheelchairhumanA" || s.type === "wheelchairhumanB" || s.type === "regularwheelchair") {
        if (current >= (s.nextChug || 0)) { audio.raceCarSkid(); s.nextChug = current + 520; }
      }
      if (s.type === "giraffewalk" && current >= (s.nextChug || 0)) { audio.birdChirp(); s.nextChug = current + 720; }
      if (s.type === "elephantwave" && current >= (s.nextChug || 0)) { audio.busDrive(); s.nextChug = current + 780; }
      if (s.type === "marblerun" && current >= (s.nextChug || 0)) { audio.hitPins(1); s.nextChug = current + 1020; }
      if (t >= 1) pin.removed = true;
      return;
    }

    if (animationUpdateMode(s.type) === "path") {
      const path = s.path;
      if (!Array.isArray(path) || path.length < 2) {
        markPinRemoved(pin, "invalid-special-path");
        return;
      }
      const scaled = t * (path.length - 1);
      const segment = Math.min(path.length - 2, Math.floor(scaled));
      const localT = scaled - segment;
      const eased = 0.5 - Math.cos(localT * Math.PI) * 0.5;
      const a = path[segment];
      const b = path[segment + 1];
      const wobbleAmp = s.type === "balloon" ? layout.pinH * 0.10 : s.type === "kite" ? layout.pinH * 0.12 : s.type === "helicopter" ? layout.pinH * 0.06 : s.type === "airplane" ? layout.pinH * 0.04 : s.type === "bird" ? layout.pinH * 0.06 : s.type === "dogzoomies" ? layout.pinH * 0.05 : layout.pinH * 0.035;
      pin.x = lerp(a.x, b.x, eased) + Math.sin(age / 120 + (s.variant % 7)) * wobbleAmp;
      pin.y = lerp(a.y, b.y, eased) + Math.cos(age / 140) * (s.type === "toytrain" || s.type === "bus" || s.type === "bulldozer" ? 3 : s.type === "helicopter" ? 8 : s.type === "bunny" ? 12 : s.type === "frog" ? 10 : s.type === "bird" ? 7 : layout.pinH * 0.025);
      pin.angle = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2 + Math.sin(age / 130) * (s.type === "balloon" ? 0.28 : s.type === "kite" ? 0.35 : s.type === "racecar" ? 0.10 : s.type === "bus" ? 0.08 : s.type === "bulldozer" ? 0.07 : s.type === "bunny" ? 0.14 : s.type === "frog" ? 0.16 : s.type === "bird" ? 0.20 : s.type === "dogzoomies" ? 0.22 : 0.18);
      if (["rocket", "firework", "meteor"].includes(s.type) && Math.random() < 0.55) makeRocketTrailParticles(pin.x, pin.y + layout.pinH * 0.20, 1);
      if (s.type === "rocket" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; audio.rocketBurst(); makePinataBurst(pin.x, pin.y); }
      if (s.type === "firework" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; audio.fireworkBurst(); makeFireworkBurst(pin.x, pin.y); }
      if (s.type === "balloon" && !s.popped && current >= s.popAt) { s.popped = true; audio.balloonPop(); makeBalloonPop(pin.x, pin.y, s.balloonColor); }
      if (s.type === "toytrain" && Math.random() < 0.22) makeTrainPuff(pin.x - layout.pinW * 0.4, pin.y + layout.pinH * 0.2);
      if (s.type === "racecar" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeRaceCarBurst(pin.x, pin.y); }
      if (s.type === "airplane" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeAirplaneBurst(pin.x, pin.y); }
      if (s.type === "helicopter" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeHelicopterBurst(pin.x, pin.y); }
      if (s.type === "bus" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeBusBurst(pin.x, pin.y); }
      if (s.type === "bulldozer" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeBulldozerBurst(pin.x, pin.y); }
      if (s.type === "bunny" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeBunnyBurst(pin.x, pin.y); }
      if (s.type === "frog" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeFrogBurst(pin.x, pin.y); }
      if (s.type === "bird" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeBirdBurst(pin.x, pin.y); }
      if (s.type === "dogzoomies" && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeDogBurst(pin.x, pin.y); }
      if (["batbaseball", "basketballhoop", "hockeypuck", "footballthrow", "soccergoal", "golfdrive", "baseballcatch", "bowlingstrike", "basketballdribble", "curling"].includes(s.type) && !s.burstDone && current >= s.burstAt) { s.burstDone = true; makeSportBurst(pin.x, pin.y, s.type); }
      if (s.type === "toytrain" && current >= (s.nextChug || 0)) { audio.toyTrainChug(); s.nextChug = current + 310; }
      if (s.type === "racecar" && current >= (s.nextChug || 0)) { audio.raceCarSkid(); s.nextChug = current + 420; }
      if (s.type === "airplane" && current >= (s.nextChug || 0)) { audio.airplanePass(); s.nextChug = current + 650; }
      if (s.type === "helicopter" && current >= (s.nextChug || 0)) { audio.helicopterChop(); s.nextChug = current + 170; }
      if (s.type === "bus" && current >= (s.nextChug || 0)) { audio.busDrive(); s.nextChug = current + 360; }
      if (s.type === "bulldozer" && current >= (s.nextChug || 0)) { audio.bulldozerClank(); s.nextChug = current + 320; }
      if (s.type === "bunny" && current >= (s.nextChug || 0)) { audio.bunnyHop(); s.nextChug = current + 340; }
      if (s.type === "frog" && current >= (s.nextChug || 0)) { audio.frogBoing(); s.nextChug = current + 420; }
      if (s.type === "bird" && current >= (s.nextChug || 0)) { audio.birdChirp(); s.nextChug = current + 260; }
      if (s.type === "dogzoomies" && current >= (s.nextChug || 0)) { audio.dogZoomies(); s.nextChug = current + 260; }
      if (["basketballdribble", "curling"].includes(s.type) && current >= (s.nextChug || 0)) { audio.hitPins(1); s.nextChug = current + 360; }
      if (t >= 1) {
        pin.removed = true;
        if ((s.type === "rocket" || s.type === "firework") && !game.pins.some(p => p !== pin && p.rocket && !p.removed && (p.rocket.type === "rocket" || p.rocket.type === "firework"))) audio.stopRocketFlight();
      }
      return;
    }

    if (s.type === "pinata") {
      pin.angle = Math.sin(age / 55) * 0.18 * (1 - t * 0.25);
      if (!s.burstDone && current >= s.burstAt) { s.burstDone = true; makePinataBurst(pin.x, pin.y); }
      if (t >= 1) pin.removed = true;
      return;
    }

    if (s.type === "pinatastar") {
      pin.angle = age / 280;
      if (!s.burstDone && current >= s.burstAt) { s.burstDone = true; makePinataBurst(pin.x, pin.y); makeFireworkBurst(pin.x, pin.y); }
      if (t >= 1) pin.removed = true;
      return;
    }

    if (s.type === "jelly") {
      if (!s.melted && current >= s.meltAt) { s.melted = true; audio.jellyMelt(); makeJellyDrips(pin.x, pin.y, s.jellyColor); }
      pin.angle = Math.sin(age / 80) * 0.10;
      if (t >= 1) pin.removed = true;
      return;
    }

    if (s.type === "catpaw") {
      const impactT = clamp((current - s.swipeAt) / (s.duration * 0.46), 0, 1);
      if (!s.pawDone && current >= s.swipeAt) { s.pawDone = true; audio.catPawBop(); makeCatPawBurst(pin.x, pin.y); }
      if (s.pawDone) {
        pin.x = lerp(pin.x, s.exit.x, impactT * 0.12);
        pin.y = lerp(pin.y, s.exit.y, impactT * 0.12);
        pin.angle += dt * (s.pawSide * 4.5);
      }
      if (t >= 1) pin.removed = true;
      return;
    }

    if (s.type === "popcorn") {
      pin.angle = Math.sin(age / 70) * 0.12;
      if (!s.popped && current >= s.popAt) { s.popped = true; audio.popcornCluster(); makePopcornBurst(pin.x, pin.y); }
      if (t >= 1) pin.removed = true;
      return;
    }

    if (s.type === "magicpaint") {
      pin.angle = Math.sin(age / 80) * 0.18;
      if (!s.burstDone && current >= s.burstAt) { s.burstDone = true; audio.paintSplash(); makePaintBurst(pin.x, pin.y, s.paintColor); }
      if (t >= 1) pin.removed = true;
      return;
    }

    if (s.type === "flower") {
      if (!s.burstDone && current >= s.burstAt) { s.burstDone = true; audio.flowerBloom(); makeFlowerBurst(pin.x, pin.y, s.petalColor); }
      if (t >= 1) pin.removed = true;
      return;
    }
  }

  function remainingUprightCount() {
    return game.pins.filter(p => !p.fallen && !p.falling && !p.rocket && !p.removed).length;
  }

  function beginReward() {
    if (!enterRewardPhase("level-cleared")) return;
    game.message = "MEOW!\nYou knocked them down!";
    audio.reward();
    for (let i = 0; i < 80; i += 1) {
      game.particles.push({
        x: rand(view.w * 0.14, view.w * 0.86),
        y: rand(view.h * 0.18, view.h * 0.45),
        vx: rand(-90, 90),
        vy: rand(-130, 70),
        size: rand(4, 11),
        color: ["#fff7a8", "#ffffff", "#7bdfff", "#ff9acb", "#8d63ff"][randInt(0, 4)],
        shape: Math.random() < 0.56 ? "star" : "confetti",
        spin: rand(-5, 5),
        startedAt: nowMs(),
        duration: rand(1200, 2300)
      });
    }
  }

  function finishResolvingSafely(current, reason = "normal") {
    if (remainingUprightCount() === 0) {
      clearLingeringResolvedPins();
      beginReward();
      return;
    }
    enterPlayingPhase(null, game.forceHitNext, `resolving-${reason}`);
    if (reason !== "normal" && current - (game.lastLifecycleWarningAt || 0) > 1000) {
      game.lastLifecycleWarningAt = current;
      console.warn(`Resolving lifecycle safety returned to playing: ${reason}`);
    }
  }

  function updateReward(current) {
    if (game.phase === "resolving") {
      const resolvingStartedAt = game.resolvingStartedAt || (game.resolvingUntil - MAX_RESOLVING_MS);
      const resolvingTimedOut = current - resolvingStartedAt > MAX_RESOLVING_MS;
      if (current >= game.resolvingUntil || resolvingTimedOut) {
        finishResolvingSafely(current, resolvingTimedOut ? "timeout" : "normal");
      }
    }
    if (game.phase === "reward" && current >= game.nextLevelAt) startLevel();
  }

  function makeRocketTrailParticles(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      game.particles.push({
        x: x + rand(-layout.pinW * 0.25, layout.pinW * 0.25),
        y: y + rand(-layout.pinW * 0.20, layout.pinW * 0.20),
        vx: rand(-45, 45),
        vy: rand(20, 105),
        size: rand(3, 8),
        color: ["#ffef86", "#ff7a31", "#ffca54", "#ffffff"][randInt(0, 3)],
        shape: Math.random() < 0.7 ? "spark" : "confetti",
        spin: rand(-5, 5),
        startedAt: nowMs(),
        duration: rand(280, 620)
      });
    }
  }

  function makePinataBurst(x, y) {
    const shapes = ["star", "confetti", "treat", "toy", "heart"];
    const colors = ["#fff7a8", "#ffffff", "#7bdfff", "#ff9acb", "#8d63ff", "#ff7a31", "#58d36f", "#ef3340"];
    for (let i = 0; i < 86; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(80, 260);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(20, 150), size: rand(5, 15), color: colors[randInt(0, colors.length - 1)], shape: shapes[randInt(0, shapes.length - 1)], spin: rand(-7, 7), startedAt: nowMs(), duration: rand(1000, 2100) });
    }
  }

  function makeFireworkBurst(x, y) {
    const colors = ["#fff7a8", "#ffffff", "#7bdfff", "#ff9acb", "#8d63ff", "#ff7a31"];
    for (let i = 0; i < 92; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(90, 300);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: rand(3, 11), color: colors[randInt(0, colors.length - 1)], shape: Math.random() < 0.68 ? "spark" : "star", spin: rand(-8, 8), startedAt: nowMs(), duration: rand(700, 1600) });
    }
  }

  function makeBalloonPop(x, y, color) {
    for (let i = 0; i < 44; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(35, 180);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(10, 80), size: rand(3, 9), color: Math.random() < 0.7 ? color : ["#ffffff", "#fff7a8", "#7bdfff"][randInt(0,2)], shape: Math.random() < 0.55 ? "confetti" : "spark", spin: rand(-7, 7), startedAt: nowMs(), duration: rand(500, 1200) });
    }
  }

  function makeJellyDrips(x, y, color) {
    for (let i = 0; i < 34; i += 1) {
      game.particles.push({ x: x + rand(-layout.pinW * 0.4, layout.pinW * 0.4), y: y + rand(-layout.pinH * 0.1, layout.pinH * 0.3), vx: rand(-55, 55), vy: rand(-40, 90), size: rand(4, 12), color, shape: Math.random() < 0.5 ? "bubble" : "confetti", spin: rand(-3, 3), startedAt: nowMs(), duration: rand(650, 1400) });
    }
  }

  function makeCatPawBurst(x, y) {
    const colors = ["#ffffff", "#ffe36d", "#ff9acb", "#7bdfff"];
    for (let i = 0; i < 36; i += 1) {
      const angle = rand(-Math.PI * 0.8, Math.PI * 0.2);
      const speed = rand(70, 220);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(20, 110), size: rand(5, 12), color: colors[randInt(0, colors.length - 1)], shape: Math.random() < 0.35 ? "paw" : "star", spin: rand(-5, 5), startedAt: nowMs(), duration: rand(650, 1400) });
    }
  }

  function makeTreasureBurst(x, y) {
    const colors = ["#ffe36d", "#fff7a8", "#ffb739", "#7bdfff", "#ff9acb"];
    for (let i = 0; i < 68; i += 1) {
      const angle = rand(0, TAU); const speed = rand(60, 240);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(10, 120), size: rand(4, 13), color: colors[randInt(0, colors.length - 1)], shape: ["star","treat","toy"][randInt(0,2)], spin: rand(-6,6), startedAt: nowMs(), duration: rand(900, 1800) });
    }
  }

  function makeTrainPuff(x, y) {
    game.particles.push({ x, y, vx: rand(-20, 20), vy: rand(-40, -5), size: rand(7, 14), color: "rgba(255,255,255,0.8)", shape: "bubble", spin: 0, startedAt: nowMs(), duration: rand(450, 850) });
  }

  function makePopcornBurst(x, y) {
    for (let i = 0; i < 54; i += 1) {
      const angle = rand(0, TAU); const speed = rand(50, 220);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(0, 120), size: rand(5, 11), color: Math.random() < 0.72 ? "#fff8d7" : "#ffcc55", shape: Math.random() < 0.7 ? "bubble" : "star", spin: rand(-4,4), startedAt: nowMs(), duration: rand(700, 1400) });
    }
  }

  function makePaintBurst(x, y, color) {
    for (let i = 0; i < 70; i += 1) {
      const angle = rand(0, TAU); const speed = rand(60, 250);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(0, 120), size: rand(4, 12), color, shape: Math.random() < 0.65 ? "confetti" : "bubble", spin: rand(-8,8), startedAt: nowMs(), duration: rand(800, 1600) });
    }
  }

  function makeFlowerBurst(x, y, color) {
    for (let i = 0; i < 48; i += 1) {
      const angle = rand(0, TAU); const speed = rand(40, 170);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(0, 100), size: rand(5, 12), color, shape: Math.random() < 0.55 ? "heart" : "star", spin: rand(-5,5), startedAt: nowMs(), duration: rand(900, 1800) });
    }
  }

  function makeWallBounceBurst(x, y) {
    for (let i = 0; i < 28; i += 1) {
      const angle = rand(-Math.PI * 0.55, Math.PI * 0.55);
      const speed = rand(50, 170);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed * (x < view.w * 0.5 ? 1 : -1), vy: Math.sin(angle) * speed, size: rand(4, 10), color: ["#ffffff","#ffe36d","#7bdfff"][randInt(0,2)], shape: Math.random() < 0.5 ? "star" : "spark", spin: rand(-8,8), startedAt: nowMs(), duration: rand(400, 900) });
    }
  }

  function makeMeteorImpact(x, y) {
    for (let i = 0; i < 58; i += 1) {
      const angle = rand(0, TAU); const speed = rand(80, 260);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(0, 140), size: rand(5, 12), color: ["#fff7a8","#ffb739","#ff7a31","#ef3340"][randInt(0,3)], shape: Math.random() < 0.6 ? "spark" : "star", spin: rand(-9,9), startedAt: nowMs(), duration: rand(700, 1400) });
    }
  }

  function makeRaceCarBurst(x, y) { makeWallBounceBurst(x, y); }
  function makeAirplaneBurst(x, y) { makeFireworkBurst(x, y); }
  function makeHelicopterBurst(x, y) { makeCatPawBurst(x, y); }
  function makeBusBurst(x, y) { makeTreasureBurst(x, y); }
  function makeBulldozerBurst(x, y) { makePinataBurst(x, y); }
  function makeBunnyBurst(x, y) { makeFlowerBurst(x, y, "#ffd8f1"); }
  function makeFrogBurst(x, y) { makeJellyDrips(x, y, "#8be37e"); }
  function makeBirdBurst(x, y) { makeFireworkBurst(x, y); }
  function makeDogBurst(x, y) { makeCatPawBurst(x, y); }
  function makeSportBurst(x, y, type) {
    const colors = type === "basketballdribble" || type === "basketballhoop" ? ["#ff8a1c", "#ffffff", "#ffe36d"] : type === "hockeypuck" || type === "curling" ? ["#dff7ff", "#ffffff", "#7bdfff"] : ["#fff7a8", "#ffffff", "#ff9acb", "#7bdfff"];
    for (let i = 0; i < 42; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(55, 210);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - rand(0, 110), size: rand(4, 11), color: colors[randInt(0, colors.length - 1)], shape: Math.random() < 0.55 ? "star" : "confetti", spin: rand(-7, 7), startedAt: nowMs(), duration: rand(700, 1500) });
    }
  }

  function makeImpactParticles(x, y, strength) {
    const count = clamp(8 + strength * 4, 10, 34);
    for (let i = 0; i < count; i += 1) {
      game.particles.push({
        x,
        y,
        vx: rand(-120, 120),
        vy: rand(-130, 85),
        size: rand(3, 8),
        color: ["#ffffff", "#ffe36d", "#ef3340", "#bfeaff"][randInt(0, 3)],
        shape: Math.random() < 0.5 ? "star" : "confetti",
        spin: rand(-5, 5),
        startedAt: nowMs(),
        duration: rand(380, 850)
      });
    }
  }

  function updateParticles(current, dt) {
    for (const p of game.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 82 * dt;
      p.spin += dt * 4;
    }
    game.particles = game.particles.filter(p => current - p.startedAt < p.duration + 80);
  }

  // =====================================================
  // RENDERING PIPELINE
  // =====================================================
  // Rendering is intentionally layered. Keep this order unless the visual
  // stacking order is intentionally changing.
  function render(current) {
    drawPlayfieldLayer(current);
    drawPinAndParticleLayer(current);
    drawPlayerAndBallLayer(current);
    drawInterfaceLayer(current);
    drawOverlayLayer(current);
  }

  function drawPlayfieldLayer(current) {
    drawBackground();
    drawTitleBar();
    drawPathPreview();
  }

  function drawPinAndParticleLayer(current) {
    drawPins(current);
    drawParticles(current);
  }

  function drawPlayerAndBallLayer(current) {
    drawCat();
    drawRoller();
    if (!game.ball && game.phase !== "reward") drawLoadedBall(layout.rollerX, layout.rollerY - layout.ballR * 0.60, layout.ballR, 0, game.nextBallSeed);
    drawBall();
  }

  function drawInterfaceLayer(current) {
    drawRotatingStatusText(current);
    drawHoldProgress(current);
    drawReward(current);
  }

  function drawOverlayLayer(current) {
    drawTitleOverlay(current);
    if (game.phase === "paused") drawPauseOverlay();
  }

  // =====================================================
  // PLAYFIELD AND BACKGROUND DRAWING
  // =====================================================
  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, view.h);
    sky.addColorStop(0, "#53cfff");
    sky.addColorStop(0.55, "#a4ebff");
    sky.addColorStop(1, "#e3fbff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, view.w, view.h);

    drawCloud(view.w * 0.18, view.h * 0.11, layout.radius * 1.4, 0.35);
    drawCloud(view.w * 0.76, view.h * 0.16, layout.radius * 1.15, 0.32);
    drawCloud(view.w * 0.53, view.h * 0.035, layout.radius * 0.95, 0.22);

    // Subtle playfield shine.
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(view.w * 0.5, view.h * 0.39, view.w * 0.55, view.h * 0.32, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawCloud(x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - size * 0.75, y + size * 0.1, size * 0.52, 0, TAU);
    ctx.arc(x - size * 0.25, y - size * 0.15, size * 0.64, 0, TAU);
    ctx.arc(x + size * 0.35, y, size * 0.54, 0, TAU);
    ctx.arc(x + size * 0.85, y + size * 0.14, size * 0.42, 0, TAU);
    ctx.rect(x - size * 1.22, y, size * 2.35, size * 0.55);
    ctx.fill();
    ctx.restore();
  }

  function drawTitleBar() {
    const size = clamp(view.w * 0.072, 26, 55);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `1000 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.lineWidth = Math.max(4, size * 0.10);
    ctx.strokeStyle = "rgba(52, 47, 145, 0.72)";
    ctx.fillStyle = "#ffe36d";
    ctx.strokeText("Meowmoon", view.w / 2, layout.topBand * 0.43);
    ctx.fillText("Meowmoon", view.w / 2, layout.topBand * 0.43);

    ctx.font = `900 ${size * 0.52}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("BOWLING", view.w / 2, layout.topBand * 0.80);
    ctx.fillText("BOWLING", view.w / 2, layout.topBand * 0.80);

    drawMoon(view.w - layout.unit * 1.45, layout.unit * 1.06, layout.unit * 0.72);
    drawTinyStar(layout.unit * 1.0, layout.unit * 1.05, layout.unit * 0.28, "#fff7a8");
    drawTinyStar(view.w * 0.18, layout.unit * 2.05, layout.unit * 0.20, "#fff7a8");
    ctx.restore();
  }

  function drawMoon(x, y, r) {
    ctx.save();
    ctx.fillStyle = "#ffe893";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x - r * 0.34, y - r * 0.08, r * 0.96, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(104,77,142,0.42)";
    ctx.beginPath();
    ctx.arc(x + r * 0.26, y + r * 0.02, r * 0.06, 0, TAU);
    ctx.arc(x + r * 0.42, y + r * 0.22, r * 0.045, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawTinyStar(x, y, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    drawStar(x, y, r, r * 0.42, 5);
    ctx.restore();
  }

  function drawPathPreview() {
    if (!game.ball || !game.ball.path || game.ball.path.length < 2) return;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "#5534ca";
    ctx.lineWidth = Math.max(2, layout.unit * 0.08);
    ctx.setLineDash([7, 11]);
    ctx.beginPath();
    ctx.moveTo(game.ball.path[0].x, game.ball.path[0].y);
    for (let i = 1; i < game.ball.path.length; i += 1) ctx.lineTo(game.ball.path[i].x, game.ball.path[i].y);
    ctx.stroke();
    ctx.restore();
  }

  // =====================================================
  // PIN DRAWING
  // =====================================================
  function drawPins(current) {
    const ordered = game.pins.slice().sort((a, b) => a.y - b.y);
    const overlayPins = [];
    for (const pin of ordered) {
      if (pin.rocket && !pin.removed && isOverlayAnimation(pin.rocket.type)) {
        overlayPins.push(pin);
        continue;
      }
      if (pin.rocket && !pin.removed) {
        try {
          drawSpecialPin(pin, current);
        } catch (err) {
          // A drawing-only error should never freeze the game or block level advancement.
          console.error("Special animation draw failed", pin.rocket?.type, err);
          pin.removed = true;
        }
      } else drawPin(pin, current);
    }
    for (const pin of overlayPins) {
      try {
        drawSpecialPin(pin, current);
      } catch (err) {
        console.error("Special animation draw failed", pin.rocket?.type, err);
        pin.removed = true;
      }
    }
  }

  function drawPin(pin, current) {
    if (pin.removed) return;
    let alpha = 1;
    if (pin.fading) alpha = clamp(1 - (current - pin.fadeStartAt) / PIN_FADE_MS, 0, 1);
    if (alpha <= 0.01) return;
    const w = layout.pinW * pin.scale;
    const h = layout.pinH * pin.scale;
    let x = pin.x;
    let y = pin.y;
    let angle = pin.angle;
    if (!pin.falling && !pin.fallen) {
      y += Math.sin(current / 900 + pin.wobble) * 0.7;
    }
    const shadowAlpha = (pin.fallen ? 0.16 : 0.23) * alpha;

    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = "#315e8f";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.05, y + h * 0.58, w * 0.78, h * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const body = ctx.createLinearGradient(-w * 0.62, -h * 0.52, w * 0.78, h * 0.62);
    body.addColorStop(0, "#d9d7d2");
    body.addColorStop(0.22, "#ffffff");
    body.addColorStop(0.62, "#f9f8f2");
    body.addColorStop(1, "#c9c6bc");

    ctx.fillStyle = body;
    ctx.strokeStyle = "rgba(125,118,105,0.45)";
    ctx.lineWidth = Math.max(1.2, w * 0.055);

    ctx.beginPath();
    ctx.moveTo(0, -h * 0.55);
    ctx.bezierCurveTo(w * 0.38, -h * 0.54, w * 0.44, -h * 0.22, w * 0.20, -h * 0.11);
    ctx.bezierCurveTo(w * 0.64, h * 0.03, w * 0.62, h * 0.42, w * 0.31, h * 0.52);
    ctx.bezierCurveTo(w * 0.16, h * 0.59, -w * 0.16, h * 0.59, -w * 0.31, h * 0.52);
    ctx.bezierCurveTo(-w * 0.62, h * 0.42, -w * 0.64, h * 0.03, -w * 0.20, -h * 0.11);
    ctx.bezierCurveTo(-w * 0.44, -h * 0.22, -w * 0.38, -h * 0.54, 0, -h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Classic red neck bands clipped to body shape.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.55);
    ctx.bezierCurveTo(w * 0.38, -h * 0.54, w * 0.44, -h * 0.22, w * 0.20, -h * 0.11);
    ctx.bezierCurveTo(w * 0.38, -h * 0.05, w * 0.39, h * 0.01, w * 0.30, h * 0.06);
    ctx.lineTo(-w * 0.30, h * 0.06);
    ctx.bezierCurveTo(-w * 0.39, h * 0.01, -w * 0.38, -h * 0.05, -w * 0.20, -h * 0.11);
    ctx.bezierCurveTo(-w * 0.44, -h * 0.22, -w * 0.38, -h * 0.54, 0, -h * 0.55);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#d91622";
    ctx.fillRect(-w * 0.40, -h * 0.24, w * 0.80, h * 0.065);
    ctx.fillRect(-w * 0.37, -h * 0.135, w * 0.74, h * 0.058);
    ctx.restore();

    // Highlights.
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-w * 0.18, -h * 0.27, w * 0.10, h * 0.20, -0.24, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.20;
    ctx.beginPath();
    ctx.ellipse(-w * 0.13, h * 0.16, w * 0.15, h * 0.25, -0.17, 0, TAU);
    ctx.fill();

    // Base ring.
    ctx.globalAlpha = alpha * 0.82;
    ctx.strokeStyle = "rgba(110,80,45,0.40)";
    ctx.lineWidth = Math.max(1, w * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, h * 0.52, w * 0.30, h * 0.045, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // =====================================================
  // SPECIAL PIN ANIMATION DRAWING
  // =====================================================
  // These draw functions should not alter game state. State changes belong in
  // updateSpecialPin() or the lifecycle helpers.
  function drawSpecialPin(pin, current) {
    const type = pin.rocket?.type || "rocket";
    const draw = animationDrawFunction(type);
    if (draw) return draw(pin, current);
    console.warn("Unknown special animation type; falling back to rocket:", type);
    return drawRocketPin(pin, current);
  }

  function drawRocketPin(pin, current) {
    const w = layout.pinW * pin.scale;
    const h = layout.pinH * pin.scale;
    const age = pin.rocket ? current - pin.rocket.startedAt : 0;
    const pulse = 1 + Math.sin(age / 85) * 0.035;

    ctx.save();
    ctx.globalAlpha = 0.20;
    ctx.fillStyle = "#315e8f";
    ctx.beginPath();
    ctx.ellipse(pin.x, pin.y + h * 0.42, w * 0.80, h * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(pin.x, pin.y);
    ctx.rotate(pin.angle);
    ctx.scale(pulse, pulse);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Flame.
    const flame = ctx.createRadialGradient(0, h * 0.56, w * 0.08, 0, h * 0.60, h * 0.35);
    flame.addColorStop(0, "#ffffff");
    flame.addColorStop(0.28, "#ffe36d");
    flame.addColorStop(0.66, "#ff7a31");
    flame.addColorStop(1, "rgba(239, 51, 64, 0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, h * 0.38);
    ctx.quadraticCurveTo(0, h * (0.96 + Math.sin(age / 70) * 0.08), w * 0.22, h * 0.38);
    ctx.quadraticCurveTo(0, h * 0.50, -w * 0.22, h * 0.38);
    ctx.fill();

    // Fins.
    ctx.fillStyle = "#ef3340";
    ctx.strokeStyle = "rgba(100, 35, 50, 0.42)";
    ctx.lineWidth = Math.max(1, w * 0.045);
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, h * 0.22);
    ctx.lineTo(-w * 0.62, h * 0.48);
    ctx.lineTo(-w * 0.20, h * 0.47);
    ctx.closePath();
    ctx.moveTo(w * 0.22, h * 0.22);
    ctx.lineTo(w * 0.62, h * 0.48);
    ctx.lineTo(w * 0.20, h * 0.47);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // The pin becomes the rocket body.
    const body = ctx.createLinearGradient(-w * 0.55, -h * 0.62, w * 0.65, h * 0.55);
    body.addColorStop(0, "#d9d7d2");
    body.addColorStop(0.22, "#ffffff");
    body.addColorStop(0.64, "#f9f8f2");
    body.addColorStop(1, "#c9c6bc");
    ctx.fillStyle = body;
    ctx.strokeStyle = "rgba(95, 90, 85, 0.50)";
    ctx.lineWidth = Math.max(1.2, w * 0.055);
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.62);
    ctx.bezierCurveTo(w * 0.42, -h * 0.48, w * 0.38, h * 0.22, w * 0.18, h * 0.48);
    ctx.bezierCurveTo(w * 0.08, h * 0.56, -w * 0.08, h * 0.56, -w * 0.18, h * 0.48);
    ctx.bezierCurveTo(-w * 0.38, h * 0.22, -w * 0.42, -h * 0.48, 0, -h * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#d91622";
    ctx.fillRect(-w * 0.30, -h * 0.25, w * 0.60, h * 0.055);
    ctx.fillRect(-w * 0.28, -h * 0.145, w * 0.56, h * 0.050);

    ctx.fillStyle = "#7bdfff";
    ctx.strokeStyle = "#275a9b";
    ctx.lineWidth = Math.max(1, w * 0.04);
    ctx.beginPath();
    ctx.arc(0, -h * 0.02, w * 0.16, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function drawPinataPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const size = layout.pinH * 0.62;
    const swing = Math.sin(age / 65) * 0.12;
    const fringeColors = ["#ff5a8e", "#8a5cff", "#41d6ff", "#5fd36a", "#ffe36d", "#ff8a33"];
    ctx.save();
    ctx.translate(pin.x, pin.y);
    ctx.rotate(swing);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#315e8f";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.64, size * 0.34, size * 0.08, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    for (let i = 0; i < fringeColors.length; i += 1) {
      const y = -size * 0.58 + i * size * 0.17;
      ctx.fillStyle = fringeColors[i];
      roundRect(ctx, -size * 0.26, y, size * 0.52, size * 0.19, size * 0.08);
      ctx.fill();
      for (let j = 0; j < 5; j += 1) {
        const fx = -size * 0.22 + j * size * 0.11;
        ctx.beginPath();
        ctx.moveTo(fx, y + size * 0.19);
        ctx.lineTo(fx + size * 0.04, y + size * 0.27 + Math.sin(age / 120 + j) * 2);
        ctx.lineTo(fx + size * 0.08, y + size * 0.19);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.strokeStyle = "rgba(110,70,40,0.72)";
    ctx.lineWidth = Math.max(2, size * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.68);
    ctx.lineTo(0, -size * 0.88);
    ctx.stroke();
    ctx.restore();
  }

  function drawPinataStarPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const size = layout.pinH * 0.62;
    ctx.save();
    ctx.translate(pin.x, pin.y);
    ctx.rotate(age / 380 + Math.sin(age / 160) * 0.08);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#315e8f";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.64, size * 0.34, size * 0.08, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    const starColors = ["#ff5a8e", "#ffe36d", "#41d6ff", "#5fd36a", "#8a5cff", "#ff8a33"];
    for (let i = 0; i < 2; i += 1) {
      ctx.fillStyle = starColors[(Math.floor(age / 180) + i * 2) % starColors.length];
      drawStar(0, 0, size * (0.42 - i * 0.08), size * (0.20 - i * 0.04), 6);
    }
    ctx.fillStyle = "#fff7ec";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.12, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBalloonPin(pin, current) {
    const s = pin.rocket; const w = layout.pinW * pin.scale; const h = layout.pinH * pin.scale;
    const age = current - s.startedAt; const puff = 1 + 0.20 * Math.sin(Math.min(1, age / 500) * Math.PI * 0.8);
    ctx.save(); ctx.globalAlpha = s.popped ? clamp(1 - (current - s.popAt) / 220, 0, 1) : 1; ctx.translate(pin.x, pin.y); ctx.rotate(Math.sin(age / 170) * 0.12);
    ctx.strokeStyle = "rgba(60,80,120,0.45)"; ctx.lineWidth = Math.max(1.5, w * 0.04); ctx.beginPath(); ctx.moveTo(0, h * 0.18); ctx.bezierCurveTo(-w * 0.2, h * 0.55, w * 0.15, h * 0.9, 0, h * 1.3); ctx.stroke();
    ctx.fillStyle = s.balloonColor; ctx.beginPath(); ctx.ellipse(0, -h * 0.08, w * 0.92 * puff, h * 0.95 * puff, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = Math.max(1.2, w * 0.035); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.beginPath(); ctx.ellipse(-w * 0.25, -h * 0.3, w * 0.15, h * 0.22, -0.3, 0, TAU); ctx.fill(); ctx.restore();
  }

  function drawFireworkPin(pin, current) {
    drawRocketPin(pin, current);
    const s = pin.rocket; const age = current - s.startedAt;
    ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = "#ffe36d"; ctx.lineWidth = Math.max(2, layout.pinW * 0.08); ctx.beginPath(); ctx.moveTo(pin.x, pin.y + layout.pinH * 0.5); ctx.lineTo(pin.x, pin.y + layout.pinH * (1.1 + 0.1 * Math.sin(age / 60))); ctx.stroke(); ctx.restore();
  }

  function drawJellyPin(pin, current) {
    const s = pin.rocket; const age = current - s.startedAt; const t = clamp(age / s.duration, 0, 1);
    const squishX = 1 + Math.sin(age / 80) * 0.14 + (s.melted ? t * 0.25 : 0);
    const squishY = 1 - Math.sin(age / 80) * 0.10 - (s.melted ? t * 0.30 : 0);
    const w = layout.pinW * pin.scale; const h = layout.pinH * pin.scale;
    ctx.save(); ctx.translate(pin.x, pin.y); ctx.rotate(Math.sin(age / 140) * 0.08); ctx.scale(squishX, squishY); ctx.globalAlpha = 0.88;
    const body = ctx.createLinearGradient(-w * 0.6, -h * 0.5, w * 0.6, h * 0.6); body.addColorStop(0, "#ffffff"); body.addColorStop(0.1, s.jellyColor); body.addColorStop(1, "rgba(255,255,255,0.4)"); ctx.fillStyle = body; ctx.strokeStyle = "rgba(95, 90, 85, 0.32)"; ctx.lineWidth = Math.max(1.2, w * 0.05);
    ctx.beginPath(); ctx.moveTo(0, -h * 0.55); ctx.bezierCurveTo(w * 0.38, -h * 0.54, w * 0.44, -h * 0.22, w * 0.20, -h * 0.11); ctx.bezierCurveTo(w * 0.64, h * 0.03, w * 0.62, h * 0.42, w * 0.31, h * 0.52); ctx.bezierCurveTo(w * 0.16, h * 0.59, -w * 0.16, h * 0.59, -w * 0.31, h * 0.52); ctx.bezierCurveTo(-w * 0.62, h * 0.42, -w * 0.64, h * 0.03, -w * 0.20, -h * 0.11); ctx.bezierCurveTo(-w * 0.44, -h * 0.22, -w * 0.38, -h * 0.54, 0, -h * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (s.melted) { ctx.globalAlpha = 0.45; ctx.fillStyle = s.jellyColor; ctx.beginPath(); ctx.ellipse(0, h * 0.62, w * (0.55 + t * 0.5), h * 0.11, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawCatPawPin(pin, current) {
    drawPin(pin, current);
    const s = pin.rocket; const age = current - s.startedAt; const pawProgress = clamp((current - s.swipeAt + s.duration * 0.25) / (s.duration * 0.45), 0, 1);
    const baseX = s.pawSide < 0 ? -layout.pinH * 1.4 : view.w + layout.pinH * 1.4; const targetX = pin.x + s.pawSide * layout.pinH * 0.2; const pawX = lerp(baseX, targetX, pawProgress); const pawY = pin.y - layout.pinH * 0.15 + Math.sin(age / 120) * 4;
    ctx.save(); ctx.translate(pawX, pawY); ctx.rotate((s.pawSide < 0 ? 1 : -1) * (0.18 + pawProgress * 0.3)); const size = layout.pinH * 0.72; ctx.fillStyle = "#ffd17a"; ctx.strokeStyle = "#b74f18"; ctx.lineWidth = Math.max(2, size * 0.05); ctx.beginPath(); ctx.ellipse(0, 0, size * 0.42, size * 0.32, 0, 0, TAU); ctx.fill(); ctx.stroke(); [[-0.24,-0.36],[-0.06,-0.46],[0.12,-0.46],[0.30,-0.35]].forEach(([ox,oy])=>{ctx.beginPath(); ctx.ellipse(size*ox,size*oy,size*0.11,size*0.13,0,0,TAU); ctx.fill(); ctx.stroke();}); ctx.restore();
  }

  function drawToyTrainPin(pin, current) {
    const s = pin.rocket; const age = current - s.startedAt; const size = layout.pinH * 0.56;
    ctx.save(); ctx.translate(pin.x, pin.y); ctx.rotate(Math.sin(age / 120) * 0.06);
    ctx.fillStyle = "#ef3340"; roundRect(ctx, -size * 0.65, -size * 0.14, size * 0.9, size * 0.42, size * 0.12); ctx.fill();
    ctx.fillStyle = "#236dcc"; roundRect(ctx, -size * 0.10, -size * 0.34, size * 0.42, size * 0.30, size * 0.10); ctx.fill();
    ctx.fillStyle = "#ffe36d"; ctx.fillRect(-size * 0.50, -size * 0.06, size * 0.16, size * 0.11);
    ctx.fillStyle = "#333"; [-0.42,-0.05,0.28].forEach((ox)=>{ctx.beginPath(); ctx.arc(size*ox, size*0.34, size*0.12, 0, TAU); ctx.fill();});
    ctx.restore();
  }


function drawPopcornPin(pin, current) {
  const s = pin.rocket;
  const age = current - s.startedAt;
  const duration = s.duration || 2200;
  const popStart = Math.max(240, s.popAt ? s.popAt - s.startedAt : duration * 0.30);
  const burst = easeOut(clamp((age - popStart) / 400, 0, 1));
  const holdPulse = age > popStart ? 1 + Math.sin(age / 120) * 0.03 : 0.78 + clamp(age / popStart, 0, 1) * 0.18;
  const bucketW = layout.pinW * 1.42;
  const bucketH = layout.pinH * 0.72;
  ctx.save();
  ctx.translate(pin.x, pin.y + layout.pinH * 0.08);
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "#244568";
  ctx.beginPath();
  ctx.ellipse(0, bucketH * 0.78, bucketW * 0.64, bucketH * 0.12, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ff7070";
  roundRect(ctx, -bucketW * 0.5, 0, bucketW, bucketH, 6);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  [-0.28, 0, 0.28].forEach(off => {
    ctx.beginPath();
    ctx.moveTo(bucketW * off, 4);
    ctx.lineTo(bucketW * off, bucketH * 0.90);
    ctx.stroke();
  });
  ctx.fillStyle = "#fff8d7";
  const kernels = [[-0.44,-0.03,.18],[-0.28,-0.16,.21],[-0.10,-0.08,.22],[0.10,-0.18,.21],[0.30,-0.07,.19],[0.45,-0.20,.17],[-0.02,-0.30,.25]];
  kernels.forEach(([ox, oy, rr], i) => {
    const r = bucketW * rr * holdPulse;
    const lift = burst * (layout.pinH * (0.22 + Math.abs(i - 3) * 0.03)) * (i % 2 ? 0.82 : 1.04);
    const wiggle = Math.sin(age / 150 + i) * 2.5 * burst;
    const x = bucketW * ox + wiggle;
    const y = bucketH * oy - lift;
    ctx.beginPath();
    ctx.arc(x - r * 0.20, y, r * 0.72, 0, TAU);
    ctx.arc(x + r * 0.18, y - r * 0.08, r * 0.62, 0, TAU);
    ctx.arc(x + r * 0.05, y + r * 0.20, r * 0.58, 0, TAU);
    ctx.fill();
  });
  if (age > popStart) {
    ctx.fillStyle = "#ffe36d";
    for (let i = 0; i < 8; i += 1) {
      const sparkleT = clamp((age - popStart - i * 40) / 800, 0, 1);
      if (sparkleT > 0 && sparkleT < 1) drawStar(Math.cos(i * 1.7) * bucketW * 0.55, -bucketH * 0.20 + Math.sin(i * 1.1) * bucketH * 0.36, 4 + sparkleT * 3, 2, 5);
    }
  }
  ctx.restore();
}

  function drawKitePin(pin, current) {
    const age = current - pin.rocket.startedAt;
    ctx.save(); ctx.translate(pin.x, pin.y); ctx.rotate(Math.sin(age / 140) * 0.2);
    ctx.fillStyle = pin.rocket.balloonColor; ctx.beginPath(); ctx.moveTo(0, -layout.pinH*0.42); ctx.lineTo(layout.pinW*0.55, 0); ctx.lineTo(0, layout.pinH*0.34); ctx.lineTo(-layout.pinW*0.55, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(60,80,120,0.5)"; ctx.beginPath(); ctx.moveTo(0, layout.pinH*0.34); ctx.lineTo(0, layout.pinH*0.95); ctx.stroke();
    for (let i=0;i<4;i+=1){ ctx.fillStyle=["#ffe36d","#ff9acb","#7bdfff","#63e38c"][i%4]; ctx.beginPath(); ctx.moveTo(0, layout.pinH*(0.46+i*0.12)); ctx.lineTo(layout.pinW*0.14, layout.pinH*(0.54+i*0.12)); ctx.lineTo(0, layout.pinH*(0.62+i*0.12)); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }

  function drawMagicPaintPin(pin, current) {
    const s = pin.rocket; const age = current - s.startedAt;
    ctx.save(); ctx.translate(pin.x, pin.y); ctx.rotate(-0.8 + Math.sin(age / 90) * 0.16);
    ctx.fillStyle = "#c28b42"; roundRect(ctx, -layout.pinW*0.12, -layout.pinH*0.52, layout.pinW*0.24, layout.pinH*0.88, 4); ctx.fill();
    ctx.fillStyle = s.paintColor; ctx.beginPath(); ctx.ellipse(0, -layout.pinH*0.56, layout.pinW*0.34, layout.pinH*0.14, 0, 0, TAU); ctx.fill();
    ctx.restore();
    if (s.burstDone) {
      ctx.save(); ctx.strokeStyle = s.paintColor; ctx.globalAlpha = 0.55; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(pin.x + layout.pinW*0.15, pin.y - layout.pinH*0.25, layout.pinH*0.42, Math.PI*0.8, Math.PI*1.65); ctx.stroke(); ctx.restore();
    }
  }

  function drawFlowerPin(pin, current) {
    const s = pin.rocket; const age = current - s.startedAt; const bloom = clamp(age / (s.duration * 0.55), 0.2, 1);
    ctx.save(); ctx.translate(pin.x, pin.y + layout.pinH*0.08);
    ctx.strokeStyle = "#4cae57"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, layout.pinH*0.52); ctx.quadraticCurveTo(-4, 10, 0, -layout.pinH*0.1); ctx.stroke();
    ctx.fillStyle = s.petalColor; for (let i=0;i<6;i+=1){ ctx.save(); ctx.rotate(i*TAU/6 + age/1000); ctx.beginPath(); ctx.ellipse(0, -layout.pinH*0.18*bloom, layout.pinW*0.25*bloom, layout.pinH*0.24*bloom, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = "#ffe36d"; ctx.beginPath(); ctx.arc(0, 0, layout.pinW*0.18*bloom, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRaceCarPin(pin, current) {
    const age = current - pin.rocket.startedAt; const size = layout.pinH * 0.52;
    ctx.save(); ctx.translate(pin.x, pin.y); ctx.rotate(Math.sin(age / 150) * 0.06);
    ctx.fillStyle = "#ef3340"; roundRect(ctx, -size * 0.58, -size * 0.10, size * 1.02, size * 0.34, size * 0.12); ctx.fill();
    ctx.fillStyle = "#ffd24d"; roundRect(ctx, -size * 0.18, -size * 0.26, size * 0.34, size * 0.20, size * 0.08); ctx.fill();
    ctx.fillStyle = "#333"; [-0.35,0.22].forEach(ox=>{ctx.beginPath(); ctx.arc(size*ox, size*0.26, size*0.12, 0, TAU); ctx.fill();});
    ctx.restore();
  }

  function drawAirplanePin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const size = layout.pinH * 0.58;
    ctx.save();
    ctx.translate(pin.x, pin.y);
    ctx.rotate(-0.45 + Math.sin(age / 240) * 0.04);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#7aa3d6";
    ctx.lineWidth = Math.max(2, size * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.86);
    ctx.lineTo(size * 1.02, size * 0.68);
    ctx.lineTo(0, size * 0.30);
    ctx.lineTo(-size * 1.02, size * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#d91622";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.80);
    ctx.lineTo(0, size * 0.30);
    ctx.moveTo(0, size * 0.30);
    ctx.lineTo(size * 0.60, size * 0.52);
    ctx.moveTo(0, size * 0.30);
    ctx.lineTo(-size * 0.60, size * 0.52);
    ctx.stroke();
    ctx.restore();
  }

  function drawHelicopterPin(pin, current) {
    const age = current - pin.rocket.startedAt; const size = layout.pinH * 0.54;
    ctx.save(); ctx.translate(pin.x, pin.y);
    ctx.fillStyle = "#63e38c"; roundRect(ctx, -size * 0.42, -size * 0.16, size * 0.72, size * 0.36, size * 0.16); ctx.fill();
    ctx.fillStyle = "#7bdfff"; roundRect(ctx, -size * 0.16, -size * 0.12, size * 0.28, size * 0.18, size * 0.06); ctx.fill();
    ctx.strokeStyle = "#555"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-size*0.14, size*0.24); ctx.lineTo(size*0.34, size*0.24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-size*0.52, -size*0.30); ctx.lineTo(size*0.52, -size*0.30); ctx.stroke();
    ctx.save(); ctx.rotate(age / 80); ctx.beginPath(); ctx.moveTo(-size*0.66, -size*0.30); ctx.lineTo(size*0.66, -size*0.30); ctx.moveTo(0, -size*0.96); ctx.lineTo(0, size*0.36); ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  function drawBusPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const s = layout.pinH * 1.10;
    const wheelSpin = age / 150;
    ctx.save();
    ctx.translate(pin.x, pin.y + s * 0.04);
    ctx.rotate(Math.sin(age / 180) * 0.04);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.fillStyle = "#ffcf33"; ctx.strokeStyle = "#7a5b00"; ctx.lineWidth = Math.max(2, s * 0.028);
    roundRect(ctx, -s * 0.72, -s * 0.18, s * 1.42, s * 0.44, s * 0.08); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f2c000"; roundRect(ctx, -s * 0.68, -s * 0.28, s * 0.98, s * 0.18, s * 0.06); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#dff3ff";
    for (let i = 0; i < 5; i += 1) { roundRect(ctx, -s * 0.56 + i * s * 0.18, -s * 0.24, s * 0.14, s * 0.11, 4); ctx.fill(); ctx.stroke(); }
    roundRect(ctx, s * 0.36, -s * 0.16, s * 0.17, s * 0.22, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1f3556"; ctx.font = `bold ${Math.max(8, s * 0.07)}px Arial`; ctx.textAlign = "center";
    ctx.fillText("SCHOOL", -s * 0.05, -s * 0.02);
    ctx.fillStyle = "#1d2330";
    [[-s * 0.42, s * 0.28], [s * 0.34, s * 0.28]].forEach(([wx, wy]) => {
      ctx.beginPath(); ctx.arc(wx, wy, s * 0.11, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#77818f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wx, wy, s * 0.06, 0, TAU); ctx.stroke();
      for (let i = 0; i < 6; i += 1) { const a = wheelSpin + i * TAU / 6; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * s * 0.06, wy + Math.sin(a) * s * 0.06); ctx.stroke(); }
      ctx.strokeStyle = "#7a5b00";
    });
    ctx.restore();
  }

  function drawBulldozerPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const s = layout.pinH * 1.12;
    const wheelSpin = age / 150;
    const scoop = (Math.sin(age / 260) + 1) / 2;
    ctx.save();
    ctx.translate(pin.x, pin.y + s * 0.08);
    ctx.rotate(Math.sin(age / 180) * 0.03);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.fillStyle = "#ffc425"; ctx.strokeStyle = "#7f5d00"; ctx.lineWidth = Math.max(2, s * 0.028);
    roundRect(ctx, -s * 0.38, -s * 0.18, s * 0.48, s * 0.28, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#dff3ff"; roundRect(ctx, -s * 0.28, -s * 0.30, s * 0.18, s * 0.14, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f0ae12"; roundRect(ctx, -s * 0.52, s * 0.08, s * 0.98, s * 0.12, s * 0.03); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#7f5d00"; ctx.lineWidth = Math.max(3, s * 0.035);
    ctx.beginPath(); ctx.moveTo(s * 0.04, -s * 0.10); ctx.lineTo(s * 0.28, -s * 0.20 + scoop * s * 0.02); ctx.lineTo(s * 0.45, -s * 0.08 + scoop * s * 0.10); ctx.stroke();
    ctx.fillStyle = "#ffd85c"; ctx.strokeStyle = "#7f5d00";
    ctx.save(); ctx.translate(s * 0.54, 0 + scoop * s * 0.12); ctx.rotate(0.12 + scoop * 0.18);
    ctx.beginPath(); ctx.moveTo(-s * 0.03, -s * 0.08); ctx.lineTo(s * 0.16, -s * 0.12); ctx.lineTo(s * 0.18, s * 0.04); ctx.lineTo(-s * 0.06, s * 0.08); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#1d2330";
    [[-s * 0.28, s * 0.20], [s * 0.18, s * 0.20]].forEach(([wx, wy]) => {
      ctx.beginPath(); ctx.arc(wx, wy, s * 0.12, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#77818f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wx, wy, s * 0.065, 0, TAU); ctx.stroke();
      for (let i = 0; i < 6; i += 1) { const a = wheelSpin + i * TAU / 6; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * s * 0.065, wy + Math.sin(a) * s * 0.065); ctx.stroke(); }
      ctx.strokeStyle = "#7f5d00";
    });
    ctx.restore();
  }

  function drawBunnyPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const size = layout.pinH * 0.56;
    ctx.save();
    ctx.translate(pin.x, pin.y);
    ctx.rotate(Math.sin(age / 140) * 0.08);
    ctx.fillStyle = "#f3e3cf";
    ctx.strokeStyle = "#7a5f52";
    ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.beginPath();
    ctx.ellipse(0, size * 0.10, size * 0.28, size * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(size * 0.22, -size * 0.04, size * 0.14, size * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    [[size * 0.12, -size * 0.52], [size * 0.24, -size * 0.50]].forEach(([ex, ey]) => {
      ctx.fillStyle = "#f3e3cf";
      ctx.beginPath();
      ctx.ellipse(ex, ey, size * 0.05, size * 0.18, -0.1, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff8ab3";
      ctx.beginPath();
      ctx.ellipse(ex, ey + size * 0.01, size * 0.024, size * 0.11, -0.1, 0, TAU);
      ctx.fill();
    });
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-size * 0.24, size * 0.14, size * 0.10, size * 0.09, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.ellipse(size * 0.26, -size * 0.08, size * 0.035, size * 0.045, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(size * 0.245, -size * 0.095, size * 0.012, size * 0.012, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ff8ab3";
    ctx.beginPath();
    ctx.ellipse(size * 0.33, -size * 0.02, size * 0.03, size * 0.02, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e33b51";
    roundRect(ctx, size * 0.05, size * 0.14, size * 0.18, size * 0.08, size * 0.03);
    ctx.fill();
    ctx.restore();
  }

  function drawFrogPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const size = layout.pinH * 0.56;
    const jump = (Math.sin(age / 500) + 1) / 2;
    ctx.save();
    ctx.translate(pin.x, pin.y - jump * size * 0.16);
    ctx.scale(1 + 0.12 * (1 - jump), 1 - 0.10 * (1 - jump));
    ctx.fillStyle = "#43a946";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.08, size * 0.30, size * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.22, -size * 0.04, size * 0.15, size * 0.13, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#2d7e33";
    ctx.lineWidth = Math.max(3, size * 0.05);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-size * 0.16, size * 0.18);
    ctx.lineTo(-size * 0.36, size * 0.30);
    ctx.lineTo(-size * 0.46, size * 0.22);
    ctx.moveTo(size * 0.12, size * 0.18);
    ctx.lineTo(size * 0.34, size * 0.32);
    ctx.lineTo(size * 0.46, size * 0.22);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(size * 0.15, -size * 0.16, size * 0.05, size * 0.05, 0, 0, TAU);
    ctx.ellipse(size * 0.29, -size * 0.15, size * 0.05, size * 0.05, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.ellipse(size * 0.15, -size * 0.16, size * 0.02, size * 0.02, 0, 0, TAU);
    ctx.ellipse(size * 0.29, -size * 0.15, size * 0.02, size * 0.02, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBirdPin(pin, current) {
    const age = current - pin.rocket.startedAt; const size = layout.pinH * 0.50; const flap = Math.sin(age / 90) * 0.45;
    ctx.save(); ctx.translate(pin.x, pin.y); ctx.fillStyle = "#ffd96b"; ctx.beginPath(); ctx.ellipse(0, 0, size * 0.24, size * 0.18, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.rotate(-0.45 + flap); ctx.beginPath(); ctx.ellipse(-size*0.16, -size*0.04, size*0.18, size*0.08, -0.2, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.rotate(0.45 - flap); ctx.beginPath(); ctx.ellipse(size*0.16, -size*0.04, size*0.18, size*0.08, 0.2, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle="#f49b24"; ctx.beginPath(); ctx.moveTo(size*0.22, 0); ctx.lineTo(size*0.34, -size*0.04); ctx.lineTo(size*0.34, size*0.04); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawDogPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const size = layout.pinH * 0.56;
    ctx.save();
    ctx.translate(pin.x, pin.y);
    ctx.rotate(Math.sin(age / 160) * 0.12);
    ctx.fillStyle = "#d69c6a";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.06, size * 0.32, size * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.28, -size * 0.04, size * 0.15, size * 0.14, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#8b5e3c";
    ctx.beginPath();
    ctx.ellipse(size * 0.18, -size * 0.12, size * 0.07, size * 0.16, -0.45, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.36, -size * 0.10, size * 0.07, size * 0.16, 0.45, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#d69c6a";
    [-0.18, -0.05, 0.10, 0.24].forEach(ox => { ctx.fillRect(size * ox, size * 0.18, size * 0.07, size * 0.18); });
    ctx.fillStyle = "#f7f2ef";
    ctx.beginPath();
    ctx.ellipse(size * 0.33, -size * 0.01, size * 0.06, size * 0.05, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#8b5e3c";
    ctx.lineWidth = Math.max(3, size * 0.045);
    ctx.beginPath();
    ctx.moveTo(-size * 0.28, size * 0.02);
    ctx.quadraticCurveTo(-size * 0.44, -size * 0.16, -size * 0.50, size * 0.02);
    ctx.stroke();
    ctx.fillStyle = "#e33b51";
    ctx.fillRect(size * 0.20, size * 0.12, size * 0.18, size * 0.05);
    ctx.fillStyle = "#ffd24d";
    ctx.beginPath();
    ctx.arc(size * 0.28, size * 0.145, size * 0.04, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.ellipse(size * 0.31, -size * 0.08, size * 0.03, size * 0.04, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(size * 0.30, -size * 0.095, size * 0.012, size * 0.012, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }


  function drawSportBall(x, y, r, fill, stroke = "#333") {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBaseballShape(x, y, r, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const g = ctx.createRadialGradient(-r * 0.32, -r * 0.34, r * 0.08, 0, 0, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.72, "#f7f4ee");
    g.addColorStop(1, "#ded9cf");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#928a7f";
    ctx.lineWidth = Math.max(1.5, r * 0.10);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#c82333";
    ctx.lineWidth = Math.max(1.2, r * 0.09);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(-r * 0.45, 0, r * 0.80, -1.05, 1.05);
    ctx.arc(r * 0.45, 0, r * 0.80, Math.PI - 1.05, Math.PI + 1.05);
    ctx.stroke();
    ctx.lineWidth = Math.max(0.8, r * 0.045);
    for (let i = -4; i <= 4; i += 1) {
      const yy = i * r * 0.18;
      ctx.beginPath(); ctx.moveTo(-r * 0.73, yy - r * 0.055); ctx.lineTo(-r * 0.57, yy + r * 0.055); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.73, yy - r * 0.055); ctx.lineTo(r * 0.57, yy + r * 0.055); ctx.stroke();
    }
    ctx.restore();
  }

  function drawSoccerBallShape(x, y, r, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "#f8f8f4";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#111";
    drawStar(0, 0, r * 0.32, r * 0.18, 5);
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + i * TAU / 5;
      const px = Math.cos(a) * r * 0.62;
      const py = Math.sin(a) * r * 0.62;
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(a) * r * 0.19, py + Math.sin(a) * r * 0.19);
      for (let j = 1; j < 5; j += 1) {
        const aa = a + j * TAU / 5;
        ctx.lineTo(px + Math.cos(aa) * r * 0.19, py + Math.sin(aa) * r * 0.19);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = "#777";
    ctx.lineWidth = Math.max(0.8, r * 0.035);
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + i * TAU / 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32);
      ctx.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBasketballShape(x, y, r, rot = 0, withSeams = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "#e97925";
    ctx.strokeStyle = "#5c2d12";
    ctx.lineWidth = Math.max(2, r * 0.11);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (withSeams) {
      ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.beginPath();
      ctx.moveTo(-r * 0.92, 0); ctx.lineTo(r * 0.92, 0);
      ctx.moveTo(0, -r * 0.92); ctx.lineTo(0, r * 0.92);
      ctx.arc(0, 0, r * 0.84, Math.PI * 0.30, Math.PI * 0.70);
      ctx.arc(0, 0, r * 0.84, -Math.PI * 0.70, -Math.PI * 0.30);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawForwardArrowTrail(x1, y1, x2, y2, color) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 8, x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBatBaseballPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const s = layout.pinH * 1.55;
    const hitT = clamp((age - 260) / 1100, 0, 1);
    const swing = Math.sin(clamp(age / 860, 0, 1) * Math.PI) * 1.22;
    const ballX = pin.x + s * (0.32 + hitT * 0.72);
    const ballY = pin.y - s * (0.16 + hitT * 0.18);
    drawForwardArrowTrail(pin.x + s * 0.25, pin.y - s * 0.06, ballX - s * 0.14, ballY, "#ffe77d");
    ctx.save();
    ctx.translate(pin.x - s * 0.02, pin.y + s * 0.02);
    ctx.rotate(-0.88 + swing);
    ctx.strokeStyle = "#7a431d";
    ctx.lineWidth = Math.max(2, s * 0.038);
    ctx.fillStyle = "#d4a15a";
    ctx.beginPath(); ctx.ellipse(-s * 0.58, 0, s * 0.09, s * 0.13, 0, 0, TAU); ctx.fill(); ctx.stroke();
    const grad = ctx.createLinearGradient(-s * 0.62, 0, s * 0.78, 0);
    grad.addColorStop(0, "#e3bd79"); grad.addColorStop(0.5, "#cb9150"); grad.addColorStop(1, "#e6c17f");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-s * 0.58, -s * 0.035);
    ctx.lineTo(s * 0.12, -s * 0.055);
    ctx.quadraticCurveTo(s * 0.46, -s * 0.17, s * 0.78, -s * 0.10);
    ctx.quadraticCurveTo(s * 0.86, 0, s * 0.78, s * 0.10);
    ctx.quadraticCurveTo(s * 0.46, s * 0.17, s * 0.12, s * 0.055);
    ctx.lineTo(-s * 0.58, s * 0.035);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(95,55,22,.35)"; ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.moveTo(-s * .22 + i * s * .18, -s * .035); ctx.lineTo(-s * .15 + i * s * .18, s * .035); ctx.stroke(); }
    ctx.restore();
    drawBaseballShape(ballX, ballY, s * 0.15, age / 210);
  }

  function drawBasketballDribblePin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const s = layout.pinH * 1.55;
    const bounce = Math.abs(Math.sin(age / 230));
    const y = pin.y + s * 0.24 - bounce * s * 0.50;
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#315e8f";
    ctx.beginPath(); ctx.ellipse(pin.x, pin.y + s * 0.44, s * 0.34, s * 0.08, 0, 0, TAU); ctx.fill();
    ctx.restore();
    drawBasketballShape(pin.x, y, s * 0.28, age / 260, true);
  }

  function drawBasketballHoopPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const s = layout.pinH * 1.58;
    const t = clamp(age / 1600, 0, 1);
    const boardX = pin.x + s * 0.42;
    const boardY = pin.y - s * 0.34;
    const hoopX = pin.x + s * 0.10;
    const hoopY = pin.y - s * 0.02;
    const arcT = clamp(Math.min(t, 0.76) / 0.76, 0, 1);
    const ballX = t < 0.76 ? lerp(pin.x - s * 0.70, hoopX, arcT) : hoopX + s * 0.02;
    const ballY = t < 0.76 ? pin.y - s * 0.12 - Math.sin(arcT * Math.PI) * s * 0.46 : lerp(hoopY + s * 0.02, hoopY + s * 0.42, (t - 0.76) / 0.24);
    ctx.save();
    ctx.translate(boardX, boardY);
    ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.strokeStyle = "#6e879f"; ctx.lineWidth = Math.max(3, s * 0.025);
    roundRect(ctx, -s * 0.16, -s * 0.26, s * 0.38, s * 0.52, s * 0.03); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#ef3340"; ctx.lineWidth = Math.max(4, s * 0.05);
    ctx.beginPath(); ctx.moveTo(-s * 0.10, 0); ctx.lineTo(-s * 0.10, s * 0.10); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(hoopX, hoopY);
    ctx.strokeStyle = "#ef3340"; ctx.lineWidth = Math.max(4, s * 0.055);
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.28, s * 0.10, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "#e4dcc7"; ctx.lineWidth = Math.max(2, s * 0.024);
    for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.moveTo(i * s * 0.09, s * 0.05); ctx.lineTo(i * s * 0.05, s * 0.40); ctx.stroke(); }
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.moveTo(-s * (0.20 - i * 0.10), s * (0.14 + i * 0.10)); ctx.lineTo(s * (0.20 - i * 0.10), s * (0.14 + i * 0.10)); ctx.stroke(); }
    ctx.restore();
    drawBasketballShape(ballX, ballY, s * 0.18, age / 240, true);
    ctx.save();
    ctx.translate(hoopX, hoopY);
    ctx.strokeStyle = "#d92a3a"; ctx.lineWidth = Math.max(2.4, s * 0.034);
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.28, s * 0.10, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  function drawHockeyPuckPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const s = layout.pinH * 1.58;
    const t = clamp(age / 1700, 0, 1);
    const contact = 0.52;
    const puckY = pin.y + s * 0.20;
    const stickX = t < contact ? lerp(pin.x - s * 0.74, pin.x - s * 0.12, t / contact) : lerp(pin.x - s * 0.12, pin.x + s * 0.26, (t - contact) / (1 - contact));
    const puckX = t < contact ? pin.x + s * 0.04 : pin.x + s * (0.04 + ((t - contact) / (1 - contact)) * 0.88);
    drawForwardArrowTrail(pin.x + s * 0.02, puckY, puckX, puckY, "#dff7ff");
    ctx.save();
    ctx.translate(stickX, puckY - s * 0.10);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const shaftGrad = ctx.createLinearGradient(-s * 0.06, -s * 0.84, s * 0.22, 0);
    shaftGrad.addColorStop(0, "#edf1f7"); shaftGrad.addColorStop(0.45, "#d7dfe8"); shaftGrad.addColorStop(0.8, "#c8d0da"); shaftGrad.addColorStop(1, "#b8c3cf");
    ctx.strokeStyle = shaftGrad; ctx.lineWidth = Math.max(10, s * 0.12);
    ctx.beginPath(); ctx.moveTo(-s * 0.04, -s * 0.84); ctx.lineTo(s * 0.18, 0); ctx.stroke();
    ctx.strokeStyle = "#4f93ff"; ctx.lineWidth = Math.max(1.6, s * 0.020);
    ctx.beginPath(); ctx.moveTo(-s * 0.03, -s * 0.78); ctx.lineTo(s * 0.06, -s * 0.46); ctx.moveTo(0, -s * 0.61); ctx.lineTo(s * 0.10, -s * 0.48); ctx.moveTo(s * 0.03, -s * 0.42); ctx.lineTo(s * 0.12, -s * 0.30); ctx.stroke();
    ctx.fillStyle = "#dfe7f1"; ctx.strokeStyle = "#9fb0c2"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s * 0.18, 0); ctx.lineTo(s * 0.58, 0); ctx.quadraticCurveTo(s * 0.70, s * 0.01, s * 0.76, s * 0.06); ctx.quadraticCurveTo(s * 0.80, s * 0.10, s * 0.74, s * 0.14); ctx.lineTo(s * 0.26, s * 0.14); ctx.quadraticCurveTo(s * 0.16, s * 0.12, s * 0.16, s * 0.04); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#4f93ff"; roundRect(ctx, s * 0.07, -s * 0.08, s * 0.15, s * 0.07, 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#111"; ctx.strokeStyle = "#444"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(puckX, puckY, s * 0.18, s * 0.065, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.ellipse(puckX, puckY - s * .02, s * .13, s * .025, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawCurlingPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const s = layout.pinH * 1.72;
    const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
    const stoneX = lerp(layout.wallLeft + s * 0.42, layout.wallRight - s * 0.42, easeInOut(t));
    const stoneY = pin.y + s * 0.16 + Math.sin(t * Math.PI) * 3;
    ctx.save();
    ctx.fillStyle = "rgba(220,247,255,.55)";
    roundRect(ctx, layout.wallLeft + 10, pin.y + s * 0.06, layout.wallRight - layout.wallLeft - 20, s * 0.12, s * 0.04);
    ctx.fill();
    ctx.restore();
    drawForwardArrowTrail(stoneX - s * 0.64, stoneY - 2, stoneX - s * 0.14, stoneY - 2, "rgba(223,247,255,0.65)");
    ctx.save();
    ctx.translate(stoneX, stoneY);
    ctx.scale(0.5, 0.5);
    ctx.fillStyle = "#9aa3af"; ctx.strokeStyle = "#5b6672"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, 34, 18, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#737d89"; ctx.beginPath(); ctx.ellipse(0, 6, 26, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ef3340"; roundRect(ctx, -12, -23, 24, 13, 6); ctx.fill();
    ctx.strokeStyle = "#8d1d24"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    const sweep = Math.sin(age / 155) * 8;
    ctx.save();
    ctx.translate(stoneX - 40 + sweep, stoneY + 12);
    ctx.rotate(-0.80 + Math.sin(age / 260) * 0.06);
    ctx.lineCap = "round";
    const grad = ctx.createLinearGradient(0, -86, 0, 18);
    grad.addColorStop(0, "#0b467d"); grad.addColorStop(0.42, "#1d9bdc"); grad.addColorStop(0.58, "#ffffff"); grad.addColorStop(1, "#e7edf5");
    ctx.strokeStyle = grad; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, -86); ctx.lineTo(0, 18); ctx.stroke();
    ctx.strokeStyle = "#073763"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -86); ctx.lineTo(0, 18); ctx.stroke();
    ctx.fillStyle = "#202833"; roundRect(ctx, -36, 16, 72, 14, 6); ctx.fill();
    ctx.fillStyle = "#0b7fc3"; roundRect(ctx, -33, 27, 66, 7, 4); ctx.fill();
    ctx.fillStyle = "#333b47"; roundRect(ctx, -18, 10, 36, 8, 4); ctx.fill();
    ctx.restore();
  }

  function drawFootballThrowPin(pin, current) {
    const age = current - pin.rocket.startedAt;
    const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
    const e = easeInOut(t);
    const s = layout.pinH * 1.48;
    const start = { x: layout.wallLeft + 8, y: pin.y + s * 0.36 };
    const end = { x: layout.wallRight + s * 0.78, y: pin.y - s * 0.40 };
    const x = lerp(start.x, end.x, e);
    const y = lerp(start.y, end.y, e) - Math.sin(e * Math.PI) * s * 0.78;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-0.32);
    ctx.fillStyle = "#8b4a24"; ctx.strokeStyle = "#4b260f"; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.34, s * 0.19, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.1;
    ctx.beginPath(); ctx.moveTo(-s * 0.11, 0); ctx.lineTo(s * 0.11, 0); ctx.stroke();
    for (let i = -3; i <= 3; i += 1) { const xx = i * s * 0.03; ctx.beginPath(); ctx.moveTo(xx, -s * 0.04); ctx.lineTo(xx, s * 0.04); ctx.stroke(); }
    ctx.restore();
  }

  function drawSoccerGoalPin(pin, current) {
    const age = current - pin.rocket.startedAt; const s = layout.pinH * 1.48; const kick = clamp(age / 1380, 0, 1);
    ctx.save(); ctx.translate(pin.x, pin.y);
    ctx.strokeStyle = "#f6f6f6"; ctx.lineWidth = Math.max(3, s * .045); roundRect(ctx, s * .12, -s * .38, s * .78, s * .62, 5); ctx.stroke();
    ctx.strokeStyle = "#e7dfcf"; ctx.lineWidth = 2.1;
    for (let i = 1; i < 5; i += 1) { ctx.beginPath(); ctx.moveTo(s * (.12 + i * .155), -s * .38); ctx.lineTo(s * (.12 + i * .155), s * .24); ctx.stroke(); }
    for (let i = 1; i < 4; i += 1) { ctx.beginPath(); ctx.moveTo(s * .12, -s * .38 + i * s * .155); ctx.lineTo(s * .90, -s * .38 + i * s * .155); ctx.stroke(); }
    ctx.restore();
    const bx = pin.x - s * .46 + kick * s * 0.92;
    const by = pin.y - s * .03 - Math.sin(kick * Math.PI) * s * .12;
    drawForwardArrowTrail(pin.x - s * .50, pin.y, bx - s * .10, by, "rgba(255,255,255,0.50)");
    drawSoccerBallShape(bx, by, s * .17, age / 320);
  }


  // =====================================================
  // TENNIS SERVE v9 SPECIAL ANIMATION
  // Source: tennisserve-integration-v9.js
  // Generic review helpers are namespaced for the game runtime.
  // =====================================================
  const TENNISSERVE_DURATION_MS = 2400;
  const TENNISSERVE_TAU = Math.PI * 2;
  function tennisserveClamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function tennisserveLerp(a, b, t) { return a + (b - a) * t; }
  function tennisserveEaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function tennisserveEaseOut(t) { return 1 - Math.pow(1 - tennisserveClamp(t, 0, 1), 3); }
  function tennisserveRoundRect(context, x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + w - radius, y);
    context.quadraticCurveTo(x + w, y, x + w, y + radius);
    context.lineTo(x + w, y + h - radius);
    context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    context.lineTo(x + radius, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }
  function tennisserveDrawSportBall(ctx, x, y, r, fill, stroke = '#333') {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TENNISSERVE_TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function tennisserveDrawForwardArrowTrail(ctx, x1, y1, x2, y2, color) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 8, x2, y2);
    ctx.stroke();
    ctx.restore();
  }
  function tennisserveDrawAnimation(ctx, x, y, scale, elapsed, duration) {
    const s = 78 * 1.50 * scale;
    const t = tennisserveClamp(elapsed / 1700, 0, 1);
    const swing = tennisserveEaseInOut(t);
    // racquet hand position path retained, but no arm/hand is drawn in this standalone review.
    const pivotX = tennisserveLerp(x - s * 0.18, x + s * 0.20, swing);
    const pivotY = tennisserveLerp(y + s * 0.22, y - s * 0.20, Math.sin(swing * Math.PI * 0.5));
    const angle = tennisserveLerp(-1.03, 0.56, swing);
    const racquetScale = 1.75;
    const headCx = s * 0.02;
    const headCy = -s * 0.17;
    const outerRx = s * 0.23;
    const outerRy = s * 0.33;
    const innerRx = s * 0.192;
    const innerRy = s * 0.285;
    const throatY = s * 0.08;
    const headHeight = outerRy * 2;
    const handleLength = headHeight * 1.25;
    const handleTopY = throatY + s * 0.04;
    const handleBottomY = handleTopY + handleLength;
  
    // Ball contact point = center of the string bed.
    const localContactX = headCx;
    const localContactY = headCy;
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const contactX = pivotX + (localContactX * racquetScale) * cosA - (localContactY * racquetScale) * sinA;
    const contactY = pivotY + (localContactX * racquetScale) * sinA + (localContactY * racquetScale) * cosA;
  
    // Pre-contact toss approaches the center of the strings; post-contact ball departs from that same center.
    const preT = tennisserveClamp(t / 0.50, 0, 1);
    const postT = tennisserveClamp((t - 0.50) / 0.50, 0, 1);
    const tossX = x + s * 0.22;
    const tossY = y - s * 0.34;
    const ballX = t < 0.50
      ? tennisserveLerp(tossX, contactX, tennisserveEaseInOut(preT))
      : contactX + s * tennisserveEaseOut(postT) * 0.88;
    const ballY = t < 0.50
      ? tennisserveLerp(tossY, contactY, tennisserveEaseInOut(preT))
      : contactY - s * Math.sin(tennisserveEaseOut(postT) * Math.PI * 0.70) * 0.26;
  
    if (t >= 0.50) {
      tennisserveDrawForwardArrowTrail(ctx, contactX, contactY, ballX, ballY, 'rgba(195,255,82,0.45)');
    }
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x - s * 0.02, y + s * 0.44, s * 0.48, s * 0.08, 0, 0, TENNISSERVE_TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);
    ctx.scale(racquetScale, racquetScale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Handle length revised so the visible handle is approximately 1.25 times the head height.
    const gripGrad = ctx.createLinearGradient(0, handleBottomY, 0, handleTopY - s * 0.02);
    gripGrad.addColorStop(0, '#10141a');
    gripGrad.addColorStop(1, '#2b3139');
    ctx.strokeStyle = gripGrad;
    ctx.lineWidth = Math.max(8, s * 0.072);
    ctx.beginPath();
    ctx.moveTo(0, handleBottomY - s * 0.05);
    ctx.lineTo(0, handleTopY);
    ctx.stroke();
    ctx.fillStyle = '#0f1318';
    tennisserveRoundRect(ctx, -s * 0.052, handleBottomY - s * 0.11, s * 0.104, s * 0.16, s * 0.022);
    ctx.fill();
    // symmetric throat attached to the bottom of the head
    ctx.strokeStyle = '#42c7d8';
    ctx.lineWidth = Math.max(5, s * 0.044);
    ctx.beginPath();
    ctx.moveTo(0, throatY + s * 0.04);
    ctx.lineTo(0, throatY);
    ctx.moveTo(0, throatY);
    ctx.lineTo(-s * 0.08, -s * 0.005);
    ctx.moveTo(0, throatY);
    ctx.lineTo(s * 0.08, -s * 0.005);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, -s * 0.005);
    ctx.quadraticCurveTo(-s * 0.11, -s * 0.05, -s * 0.11, -s * 0.10);
    ctx.moveTo(s * 0.08, -s * 0.005);
    ctx.quadraticCurveTo(s * 0.11, -s * 0.05, s * 0.11, -s * 0.10);
    ctx.stroke();
    // racquet head
    ctx.save();
    ctx.translate(headCx, headCy);
    ctx.rotate(0.06);
    ctx.strokeStyle = '#11161e';
    ctx.lineWidth = Math.max(7, s * 0.060);
    ctx.beginPath();
    ctx.ellipse(0, 0, outerRx, outerRy, 0, 0, TENNISSERVE_TAU);
    ctx.stroke();
    ctx.strokeStyle = '#42c7d8';
    ctx.lineWidth = Math.max(3.5, s * 0.030);
    ctx.beginPath();
    ctx.ellipse(0, 0, outerRx - s * 0.005, outerRy - s * 0.005, 0, 0, TENNISSERVE_TAU);
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, innerRx, innerRy, 0, 0, TENNISSERVE_TAU);
    ctx.clip();
    ctx.strokeStyle = 'rgba(20,24,31,0.82)';
    ctx.lineWidth = Math.max(1.0, s * 0.012);
    for (let i = -4; i <= 4; i += 1) {
      const sx = i * s * 0.040;
      ctx.beginPath();
      ctx.moveTo(sx, -s * 0.29);
      ctx.lineTo(sx, s * 0.29);
      ctx.stroke();
    }
    for (let i = -5; i <= 5; i += 1) {
      const sy = i * s * 0.046;
      ctx.beginPath();
      ctx.moveTo(-s * 0.205, sy);
      ctx.lineTo(s * 0.205, sy);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
    ctx.restore();
    tennisserveDrawSportBall(ctx, ballX, ballY, s * 0.1575, '#ccff33', '#6b8e00');
  }

  function drawTennisServePin(pin, current) {
    const elapsed = Math.min(current - pin.rocket.startedAt, TENNISSERVE_DURATION_MS);
    const scale = Math.min(view.w / 760, view.h / 720);
    const leftExtent = 255 * scale;
    const rightExtent = 245 * scale;
    const topExtent = 285 * scale;
    const bottomExtent = 195 * scale;
    const anchorX = clamp(pin.x, leftExtent + 8, view.w - rightExtent - 8);
    const anchorY = clamp(pin.y + layout.pinH * 0.12, topExtent + 8, view.h - bottomExtent - 8);
    tennisserveDrawAnimation(ctx, anchorX, anchorY, scale, elapsed, TENNISSERVE_DURATION_MS);
  }

  function drawGolfDrivePin(pin, current) {
    const age = current - pin.rocket.startedAt; const s = layout.pinH * 1.55;
    const t = clamp(age / 1700, 0, 1);
    const gripX = pin.x - s * 0.10 + t * s * 0.18;
    const gripY = pin.y - s * 0.10 + Math.sin(t * Math.PI) * s * 0.10;
    const angle = lerp(-1.15, 0.65, t);
    const ballT = clamp((t - 0.54) / 0.46, 0, 1);
    const ballX = t < 0.54 ? pin.x + s * 0.18 : pin.x + s * (0.18 + ballT * 0.92);
    const ballY = t < 0.54 ? pin.y + s * 0.30 : pin.y + s * (0.30 - Math.sin(ballT * Math.PI) * 0.16);
    drawForwardArrowTrail(pin.x + s * .18, pin.y + s * .30, ballX, ballY, "rgba(255,255,255,0.45)");
    ctx.save(); ctx.strokeStyle = "#5f7f3f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pin.x - s * .50, pin.y + s * .44); ctx.lineTo(pin.x + s * .58, pin.y + s * .44); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(gripX, gripY); ctx.rotate(angle); ctx.strokeStyle = "#555"; ctx.lineWidth = Math.max(4, s * .05); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(-s * .04, -s * .42); ctx.lineTo(s * .10, -s * .08); ctx.lineTo(s * .22, s * .26); ctx.lineTo(s * .42, s * .23); ctx.stroke(); ctx.restore();
    drawSportBall(ballX, ballY, s * .075, "#e7dfcf", "#b9b09d");
  }

  function drawBaseballCatchPin(pin, current) {
    const age = current - pin.rocket.startedAt; const s = layout.pinH * 1.55; const close = clamp(age / 1200, 0, 1);
    const bx = pin.x + s * (0.52 - close * .44); const by = pin.y - s * (0.18 - close * .06);
    drawForwardArrowTrail(pin.x + s * .70, pin.y - s * .24, bx, by, "rgba(255,255,255,.45)");
    ctx.save(); ctx.translate(pin.x - s * 0.02, pin.y + s * 0.02); ctx.rotate(-0.16);
    ctx.fillStyle = "#b97843"; ctx.strokeStyle = "#6f3e1c"; ctx.lineWidth = Math.max(3, s * .03);
    ctx.beginPath();
    ctx.moveTo(-s * .34, s * .28);
    ctx.quadraticCurveTo(-s * .48, -s * .08, -s * .24, -s * .42);
    ctx.quadraticCurveTo(-s * .10, -s * .55, 0, -s * .40);
    ctx.quadraticCurveTo(s * .10, -s * .55, s * .20, -s * .38);
    ctx.quadraticCurveTo(s * .32, -s * .50, s * .40, -s * .28);
    ctx.quadraticCurveTo(s * .50, -s * .32, s * .58, -s * .10);
    ctx.quadraticCurveTo(s * .50, s * .08, s * .34, s * .24);
    ctx.quadraticCurveTo(s * .10, s * .38, -s * .34, s * .28);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8b4d23";
    ctx.beginPath(); ctx.moveTo(-s * .16, -s * .18); ctx.lineTo(-s * .02, -s * .36); ctx.lineTo(s * .16, -s * .22); ctx.lineTo(s * .08, -s * .05); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#f2c38c"; ctx.lineWidth = Math.max(2, s * .022);
    const fingers = [-0.18, -0.04, 0.10, 0.24];
    fingers.forEach((fx) => { ctx.beginPath(); ctx.moveTo(s * fx, -s * .30); ctx.quadraticCurveTo(s * (fx + 0.02), -s * .04, s * (fx - 0.01), s * .18); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(-s * .30, -s * .10); ctx.quadraticCurveTo(-s * .40, s * .06, -s * .34, s * .24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * .06, -s * .30); ctx.lineTo(s * .10, -s * .16); ctx.moveTo(-s * .02, -s * .24); ctx.lineTo(s * .14, -s * .10); ctx.moveTo(s * .02, -s * .18); ctx.lineTo(s * .18, -s * .04); ctx.stroke();
    ctx.restore();
    drawBaseballShape(bx, by, s * .09, age / 240);
  }

  function drawBowlingStrikePin(pin, current) {
    const age = current - pin.rocket.startedAt; const s = layout.pinH * 1.45;
    const t = clamp(age / 1500, 0, 1); const hitT = clamp((t - 0.58) / 0.42, 0, 1); const ballX = -s * .68 + t * s * .98;
    ctx.save(); ctx.translate(pin.x, pin.y + s * 0.02);
    const positions = [{ x: s * .12, y: -s * .20 }, { x: s * .02, y: 0 }, { x: s * .22, y: 0 }, { x: -s * .08, y: s * .20 }, { x: s * .12, y: s * .20 }, { x: s * .32, y: s * .20 }];
    positions.forEach((p, i) => {
      const local = clamp((hitT - i * 0.04) * 1.8, 0, 1);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(local ? (-1.15 * local + Math.sin(age / 150 + i) * 0.10) : 0);
      ctx.fillStyle = "#fff9ee"; ctx.strokeStyle = "#8c7d66"; ctx.lineWidth = 1.5;
      roundRect(ctx, -s * .05, -s * .22, s * .10, s * .42, s * .05); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#d91622"; ctx.fillRect(-s * .045, -s * .08, s * .09, s * .028);
      ctx.restore();
    });
    drawSportBall(ballX, s * .20, s * .19, "#2b3f67", "#14213d");
    if (hitT > 0) { ctx.fillStyle = "#ffe36d"; for (let i = 0; i < 10; i += 1) drawStar(s * (.12 + Math.cos(i) * .42), s * .02 + Math.sin(i * 1.7) * s * .30, s * .035, s * .015, 5); }
    ctx.restore();
  }

function drawGroundLineV131(y, color = "rgba(90,110,130,0.32)") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(layout.wallLeft + 10, y);
  ctx.lineTo(layout.wallRight - 10, y);
  ctx.stroke();
  ctx.restore();
}

function drawJoggingStroller(pinX, pinY, s, age, withParent) {
  const wheelSpin = age / 220;
  const bob = Math.sin(age / 190) * s * 0.015;
  const x = pinX + Math.sin(age / 900) * s * 0.06;
  const y = pinY + bob;
  const ground = y + s * 0.50;
  const rearX = x + s * 0.24;
  const rearY = ground - s * 0.02;
  const frontX = x - s * 0.58;
  const frontY = ground - s * 0.02;
  const rearR = s * 0.22;
  const frontR = s * 0.18;
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "#244568";
  ctx.beginPath();
  ctx.ellipse(x - s * 0.05, ground + s * 0.12, s * 0.95, s * 0.09, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  [
    { wx: rearX - s * 0.10, wy: rearY, r: rearR },
    { wx: rearX + s * 0.27, wy: rearY, r: rearR * 0.92 },
    { wx: frontX, wy: frontY, r: frontR }
  ].forEach((wheel, idx) => {
    ctx.save();
    ctx.translate(wheel.wx, wheel.wy);
    ctx.strokeStyle = "#0f141b";
    ctx.lineWidth = Math.max(4, s * 0.030);
    ctx.beginPath(); ctx.arc(0, 0, wheel.r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "#9099a6";
    ctx.lineWidth = Math.max(1.2, s * 0.009);
    for (let i = 0; i < 8; i += 1) {
      const a = wheelSpin + i * TAU / 8 + idx * 0.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * wheel.r * 0.82, Math.sin(a) * wheel.r * 0.82);
      ctx.stroke();
    }
    ctx.fillStyle = "#65707c";
    ctx.beginPath(); ctx.arc(0, 0, wheel.r * 0.10, 0, TAU); ctx.fill();
    ctx.restore();
  });
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#8e98a4";
  ctx.lineWidth = Math.max(5, s * 0.035);
  ctx.beginPath();
  ctx.moveTo(frontX, frontY - frontR * 0.35);
  ctx.lineTo(x - s * 0.05, y + s * 0.20);
  ctx.lineTo(rearX + s * 0.18, rearY - rearR * 0.35);
  ctx.lineTo(x + s * 0.58, y - s * 0.58);
  ctx.stroke();
  ctx.strokeStyle = "#2b333d";
  ctx.lineWidth = Math.max(4, s * 0.030);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.48, y - s * 0.56);
  ctx.lineTo(x + s * 0.78, y - s * 0.68);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = withParent ? "#222830" : "#11161c";
  ctx.strokeStyle = "#14181f";
  ctx.lineWidth = Math.max(2, s * 0.016);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.40, y - s * 0.02);
  ctx.lineTo(x + s * 0.20, y + s * 0.06);
  ctx.lineTo(x + s * 0.02, y + s * 0.25);
  ctx.lineTo(x - s * 0.46, y + s * 0.20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const canopyGrad = ctx.createLinearGradient(x - s * 0.50, y - s * 0.56, x + s * 0.30, y - s * 0.16);
  canopyGrad.addColorStop(0, withParent ? "#3a424e" : "#252a31");
  canopyGrad.addColorStop(1, withParent ? "#171b21" : "#05070a");
  ctx.fillStyle = canopyGrad;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.50, y - s * 0.16);
  ctx.quadraticCurveTo(x - s * 0.35, y - s * 0.62, x + s * 0.24, y - s * 0.50);
  ctx.quadraticCurveTo(x + s * 0.34, y - s * 0.30, x + s * 0.18, y - s * 0.08);
  ctx.lineTo(x - s * 0.50, y - s * 0.16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (withParent) drawJoggingParent(x + s * 0.92, y - s * 0.23, s, age);
}

function drawJoggingParent(cx, cy, s, age) {
  const stride = Math.sin(age / 185);
  const opposite = Math.sin(age / 185 + Math.PI);
  const skin = "#d69b76";
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = skin;
  ctx.lineWidth = Math.max(5, s * 0.035);
  ctx.beginPath(); ctx.moveTo(cx - s * 0.08, cy - s * 0.20); ctx.lineTo(cx - s * 0.42, cy - s * 0.27); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.06, cy - s * 0.12); ctx.lineTo(cx - s * 0.36, cy - s * 0.24); ctx.stroke();
  ctx.fillStyle = "#ffb6c8";
  ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.04, s * 0.13, s * 0.26, -0.20, 0, TAU); ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(cx - s * 0.06, cy - s * 0.38, s * 0.095, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#2a1b13";
  ctx.lineWidth = Math.max(2.4, s * 0.018);
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.10 + i * s * 0.02, cy - s * 0.47);
    ctx.quadraticCurveTo(cx + s * 0.05 + i * s * 0.02, cy - s * 0.58 - Math.abs(stride) * s * 0.08, cx + s * 0.18 + i * s * 0.02, cy - s * 0.44);
    ctx.stroke();
  }
  ctx.strokeStyle = "#172033";
  ctx.lineWidth = Math.max(6, s * 0.045);
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.20); ctx.lineTo(cx - s * (0.10 + 0.20 * stride), cy + s * 0.42); ctx.lineTo(cx - s * (0.30 + 0.22 * stride), cy + s * 0.58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.02, cy + s * 0.18); ctx.lineTo(cx + s * (0.12 + 0.16 * opposite), cy + s * 0.40); ctx.lineTo(cx + s * (0.26 + 0.25 * opposite), cy + s * 0.58); ctx.stroke();
  ctx.restore();
}

function drawJogStrollerParentPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const travelT = easeInOut(clamp(age / pin.rocket.duration, 0, 1));
  const startX = layout.wallRight + 120;
  const endX = layout.wallLeft - 140;
  const drawX = lerp(startX, endX, travelT);
  drawGroundLineV131(pin.y + 78);
  drawForwardArrowTrail(drawX + 115, pin.y + 48, drawX - 95, pin.y + 48, "rgba(255,255,255,0.42)");
  drawJoggingStroller(drawX, pin.y + 18, 105, age, true);
}

function drawWheelchairGalleryPin(pin, current, variant) {
  const age = current - pin.rocket.startedAt;
  const s = layout.pinH * 1.58;
  const travelT = easeInOut(clamp(age / pin.rocket.duration, 0, 1));
  const startX = layout.wallLeft - s * 1.05;
  const endX = layout.wallRight + s * 1.10;
  const cx = lerp(startX, endX, travelT);
  const cy = pin.y + s * 0.02;
  drawForwardArrowTrail(cx - s * 0.58, cy - s * 0.08, cx + s * 0.86, cy - s * 0.08, "rgba(255,255,255,0.30)");
  drawWheelchairRacerGallery(cx, cy, s, age, variant);
}

function drawWheelchairRacerGallery(cx, cy, s, age, variant) {
  const rearR = s * 0.36;
  const frontR = s * 0.16;
  const rearX = cx - s * 0.12;
  const rearY = cy;
  const frontX = cx + s * 0.70;
  const frontY = cy + s * 0.06;
  const push = Math.sin(age / 280);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#19324d";
  ctx.beginPath(); ctx.ellipse(cx + s * 0.18, cy + rearR * 0.86, s * 0.82, s * 0.11, 0, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "#202731";
  ctx.lineWidth = Math.max(3, s * 0.03);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(rearX + rearR * 0.08, rearY - rearR * 0.05);
  ctx.lineTo(cx + s * 0.18, cy - s * 0.22);
  ctx.lineTo(frontX - frontR * 0.20, frontY - frontR * 0.30);
  ctx.lineTo(frontX, frontY);
  ctx.lineTo(cx + s * 0.10, cy - s * 0.02);
  ctx.lineTo(rearX + rearR * 0.20, rearY + rearR * 0.22);
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.02, cy - s * 0.14); ctx.lineTo(cx - s * 0.12, cy - s * 0.28); ctx.lineTo(cx + s * 0.03, cy - s * 0.28); ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.translate(rearX, rearY);
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = Math.max(4, s * 0.038);
  ctx.beginPath(); ctx.arc(0, 0, rearR, 0, TAU); ctx.stroke();
  if (variant !== "humanB") {
    const g = ctx.createRadialGradient(-rearR * 0.26, -rearR * 0.28, rearR * 0.08, 0, 0, rearR * 0.96);
    g.addColorStop(0, "#6e7681"); g.addColorStop(0.38, "#242b34"); g.addColorStop(1, "#0f1218");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rearR * 0.90, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ef3340"; ctx.beginPath(); ctx.moveTo(-rearR * 0.70, 0); ctx.lineTo(-rearR * 0.14, -rearR * 0.28); ctx.lineTo(-rearR * 0.08, rearR * 0.22); ctx.closePath(); ctx.fill();
  } else {
    ctx.strokeStyle = "#757d88";
    ctx.lineWidth = Math.max(1.5, s * 0.012);
    for (let i = 0; i < 9; i += 1) { const a = age / 500 + i * TAU / 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * rearR * 0.88, Math.sin(a) * rearR * 0.88); ctx.stroke(); }
  }
  ctx.restore();
  ctx.save();
  ctx.translate(frontX, frontY);
  ctx.strokeStyle = "#1d1d1d"; ctx.lineWidth = Math.max(3, s * 0.024); ctx.beginPath(); ctx.arc(0, 0, frontR, 0, TAU); ctx.stroke();
  ctx.restore();
  const shoulderX = rearX + rearR * 0.10;
  const shoulderY = rearY - rearR * 0.96;
  const armFront = { x: rearX + Math.cos(-0.55 + push * 0.36) * rearR * 0.82, y: rearY + Math.sin(-0.55 + push * 0.36) * rearR * 0.82 };
  const armBack = { x: rearX + Math.cos(0.55 + push * 0.36) * rearR * 0.84, y: rearY + Math.sin(0.55 + push * 0.36) * rearR * 0.84 };
  if (variant === "stick") return drawWheelchairStickFigureGallery(shoulderX, shoulderY, s, armFront, armBack);
  if (variant === "humanA") return drawWheelchairHumanAGallery(shoulderX, shoulderY, s, armFront, armBack);
  return drawWheelchairHumanBGallery(shoulderX, shoulderY, s, armFront, armBack, age);
}

function drawWheelchairStickFigureGallery(shoulderX, shoulderY, s, armFront, armBack) {
  const headX = shoulderX + s * 0.13;
  const headY = shoulderY - s * 0.18;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#252a31";
  ctx.lineWidth = Math.max(4, s * 0.028);
  ctx.beginPath(); ctx.moveTo(shoulderX - s * 0.14, shoulderY + s * 0.12); ctx.lineTo(shoulderX + s * 0.08, shoulderY - s * 0.08); ctx.lineTo(headX, headY + s * 0.08); ctx.stroke();
  ctx.beginPath(); ctx.arc(headX, headY, s * 0.085, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(shoulderX + s * 0.04, shoulderY - s * 0.04); ctx.lineTo((shoulderX + armFront.x) / 2, (shoulderY + armFront.y) / 2); ctx.lineTo(armFront.x, armFront.y); ctx.moveTo(shoulderX - s * 0.04, shoulderY + s * 0.04); ctx.lineTo((shoulderX + armBack.x) / 2 - s * 0.06, (shoulderY + armBack.y) / 2); ctx.lineTo(armBack.x, armBack.y); ctx.stroke();
  ctx.restore();
}

function drawWheelchairHumanAGallery(shoulderX, shoulderY, s, armFront, armBack) {
  const skin = "#c88f6b";
  const headX = shoulderX + s * 0.15;
  const headY = shoulderY - s * 0.16;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = "#0e5bb5";
  ctx.beginPath();
  ctx.moveTo(shoulderX - s * 0.12, shoulderY + s * 0.11);
  ctx.quadraticCurveTo(shoulderX - s * 0.02, shoulderY - s * 0.18, shoulderX + s * 0.10, shoulderY - s * 0.18);
  ctx.quadraticCurveTo(shoulderX + s * 0.17, shoulderY - s * 0.16, shoulderX + s * 0.18, shoulderY - s * 0.09);
  ctx.quadraticCurveTo(shoulderX + s * 0.15, shoulderY + s * 0.03, shoulderX + s * 0.08, shoulderY + s * 0.09);
  ctx.quadraticCurveTo(shoulderX - s * 0.02, shoulderY + s * 0.15, shoulderX - s * 0.12, shoulderY + s * 0.11);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = skin;
  ctx.lineWidth = Math.max(5, s * 0.040);
  ctx.beginPath(); ctx.moveTo(shoulderX + s * 0.03, shoulderY - s * 0.03); ctx.lineTo((shoulderX + armFront.x) / 2, (shoulderY + armFront.y) / 2); ctx.lineTo(armFront.x, armFront.y); ctx.moveTo(shoulderX - s * 0.04, shoulderY + s * 0.02); ctx.lineTo((shoulderX + armBack.x) / 2 - s * 0.06, (shoulderY + armBack.y) / 2 + s * 0.01); ctx.lineTo(armBack.x, armBack.y); ctx.stroke();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(headX, headY, s * 0.075, 0, TAU); ctx.fill();
  ctx.fillStyle = "#f4f8ff"; ctx.beginPath(); ctx.ellipse(headX - s * 0.005, headY - s * 0.040, s * 0.085, s * 0.045, -0.20, Math.PI, TAU * 1.02); ctx.fill();
  ctx.restore();
}

function drawWheelchairHumanBGallery(shoulderX, shoulderY, s, armFront, armBack, age) {
  const skin = "#d2a07d";
  const headX = shoulderX + s * 0.10;
  const headY = shoulderY - s * 0.17;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = "#d42334";
  ctx.beginPath();
  ctx.moveTo(shoulderX - s * 0.13, shoulderY + s * 0.11);
  ctx.quadraticCurveTo(shoulderX - s * 0.04, shoulderY - s * 0.19, shoulderX + s * 0.08, shoulderY - s * 0.20);
  ctx.quadraticCurveTo(shoulderX + s * 0.15, shoulderY - s * 0.19, shoulderX + s * 0.17, shoulderY - s * 0.10);
  ctx.quadraticCurveTo(shoulderX + s * 0.14, shoulderY + s * 0.04, shoulderX + s * 0.06, shoulderY + s * 0.10);
  ctx.quadraticCurveTo(shoulderX - s * 0.02, shoulderY + s * 0.14, shoulderX - s * 0.13, shoulderY + s * 0.11);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = skin;
  ctx.lineWidth = Math.max(5, s * 0.042);
  ctx.beginPath(); ctx.moveTo(shoulderX + s * 0.02, shoulderY - s * 0.04); ctx.lineTo((shoulderX + armFront.x) / 2, (shoulderY + armFront.y) / 2 - s * 0.02); ctx.lineTo(armFront.x, armFront.y); ctx.moveTo(shoulderX - s * 0.07, shoulderY + s * 0.03); ctx.lineTo((shoulderX + armBack.x) / 2 - s * 0.08, (shoulderY + armBack.y) / 2 + s * 0.02); ctx.lineTo(armBack.x, armBack.y); ctx.stroke();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(headX, headY, s * 0.078, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#2e211b";
  ctx.lineWidth = Math.max(2.4, s * 0.016);
  for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.moveTo(headX - s * 0.04 + i * s * 0.02, headY - s * 0.07); ctx.quadraticCurveTo(headX - s * 0.07 + i * s * 0.03, headY - s * 0.13, headX + s * 0.01 + i * s * 0.02, headY - s * 0.10); ctx.stroke(); }
  ctx.restore();
}

function drawStarTreePin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const grow = easeOut(clamp(age / (pin.rocket.duration * 0.74), 0, 1));
  const sway = Math.sin(age / 520) * 0.04;
  const baseX = pin.x;
  const baseY = pin.y + 88;
  drawGroundLineV131(baseY + 4, "rgba(70,110,64,0.35)");
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(1, grow);
  ctx.rotate(sway);
  ctx.strokeStyle = "#7a4a25";
  ctx.lineCap = "round";
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -128); ctx.stroke();
  ctx.lineWidth = 4;
  [[-18,-108],[20,-106],[-34,-96],[38,-94],[-46,-82],[50,-80],[-28,-66],[28,-64],[-14,-52],[14,-50],[-6,-118],[8,-120]].forEach(([bx, by], i) => {
    ctx.beginPath(); ctx.moveTo(0, by + 18); ctx.quadraticCurveTo(bx * 0.38, by + (i % 2 ? -4 : 4), bx, by); ctx.stroke();
  });
  ctx.restore();
  const crown = clamp((grow - 0.22) / 0.78, 0, 1);
  ctx.save();
  ctx.translate(baseX, baseY - 118 * grow);
  ctx.scale(crown, crown);
  const colors = ["#2f9e44", "#3fb950", "#76c043", "#e0772b", "#d63f2f", "#5bb04e"];
  [[0,-72,26],[-18,-60,24],[18,-60,24],[-38,-54,22],[38,-52,22],[-54,-38,20],[54,-36,20],[-24,-34,22],[24,-34,22],[0,-30,24],[-62,-18,20],[62,-16,20],[-40,-8,22],[40,-6,22],[-18,8,24],[18,8,24],[0,14,26],[-48,18,18],[48,20,18],[-26,-80,18],[26,-78,18]].forEach(([lx, ly, r], i) => {
    ctx.fillStyle = colors[i % colors.length];
    drawStarTreeLeaf(lx, ly, r * (0.78 + 0.10 * Math.sin(age / 300 + i)), age / 860 + i * 0.22);
  });
  ctx.restore();
}

function drawStarTreeLeaf(x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.18, -r * 0.36);
  ctx.lineTo(r * 0.55, -r * 0.56);
  ctx.lineTo(r * 0.38, -r * 0.10);
  ctx.lineTo(r * 0.88, -r * 0.02);
  ctx.lineTo(r * 0.32, r * 0.16);
  ctx.lineTo(r * 0.44, r * 0.65);
  ctx.lineTo(0, r * 0.36);
  ctx.lineTo(-r * 0.44, r * 0.65);
  ctx.lineTo(-r * 0.32, r * 0.16);
  ctx.lineTo(-r * 0.88, -r * 0.02);
  ctx.lineTo(-r * 0.38, -r * 0.10);
  ctx.lineTo(-r * 0.55, -r * 0.56);
  ctx.lineTo(-r * 0.18, -r * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDecorativeStarTree(baseX, baseY, grow, sway, scale, colors, age, offset = 0) {
  const trunkH = 128 * scale;
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(1, grow);
  ctx.rotate(sway);
  ctx.strokeStyle = "#7a4a25";
  ctx.lineCap = "round";
  ctx.lineWidth = 8 * scale;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -trunkH); ctx.stroke();
  ctx.lineWidth = 4 * scale;
  [[-18,-108],[20,-106],[-34,-96],[38,-94],[-46,-82],[50,-80],[-28,-66],[28,-64],[-14,-52],[14,-50],[-6,-118],[8,-120]].forEach(([bx, by], i) => {
    const sbx = bx * scale; const sby = by * scale;
    ctx.beginPath(); ctx.moveTo(0, sby + 18 * scale); ctx.quadraticCurveTo(sbx * 0.38, sby + (i % 2 ? -4 : 4) * scale, sbx, sby); ctx.stroke();
  });
  ctx.restore();
  const crown = clamp((grow - 0.22) / 0.78, 0, 1);
  ctx.save();
  ctx.translate(baseX, baseY - (trunkH - 10 * scale) * grow);
  ctx.scale(crown, crown);
  const leaves = [[0,-72,26],[-18,-60,24],[18,-60,24],[-38,-54,22],[38,-52,22],[-54,-38,20],[54,-36,20],[-24,-34,22],[24,-34,22],[0,-30,24],[-62,-18,20],[62,-16,20],[-40,-8,22],[40,-6,22],[-18,8,24],[18,8,24],[0,14,26],[-48,18,18],[48,20,18],[-26,-80,18],[26,-78,18]];
  leaves.forEach(([lx, ly, r], i) => {
    ctx.fillStyle = colors[i % colors.length];
    drawStarTreeLeaf(lx * scale, ly * scale, r * scale * (0.78 + 0.10 * Math.sin(age / 300 + i + offset)), age / 860 + i * 0.22 + offset);
  });
  ctx.restore();
}

function drawThreeStarTreesPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const grow = easeOut(clamp(age / (pin.rocket.duration * 0.78), 0, 1));
  drawGroundLineV131(pin.y + 96, "rgba(70,110,64,0.35)");
  drawDecorativeStarTree(layout.wallLeft + 44, pin.y + 92, grow, Math.sin(age / 520) * 0.03, 1.10, ["#ffd84e", "#ff8e63", "#7bd879"], age, 0.0);
  drawDecorativeStarTree(pin.x, pin.y + 96, grow, Math.sin(age / 490 + 0.5) * 0.04, 1.34, ["#ff8ec4", "#ffd84e", "#7bd8ff"], age, 0.6);
  drawDecorativeStarTree(layout.wallRight - 46, pin.y + 94, grow, Math.sin(age / 560 + 1.0) * 0.035, 1.20, ["#9b77ff", "#79d879", "#ffcf59"], age, 1.2);
}

function drawTinyWheelchairForVan(cx, cy, s, age, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const rearR = s * 0.18;
  const frontR = s * 0.075;
  const rearX = cx - s * 0.12;
  const rearY = cy;
  const frontX = cx + s * 0.28;
  const frontY = cy + s * 0.04;
  ctx.strokeStyle = "#1e2632";
  ctx.lineWidth = Math.max(2, s * 0.022);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(rearX, rearY); ctx.lineTo(cx, cy - s * 0.17); ctx.lineTo(frontX, frontY); ctx.lineTo(cx + s * 0.02, cy); ctx.stroke();
  ctx.beginPath(); ctx.arc(rearX, rearY, rearR, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(frontX, frontY, frontR, 0, TAU); ctx.stroke();
  ctx.fillStyle = "#4b7bd8"; ctx.beginPath(); ctx.ellipse(cx - s * 0.02, cy - s * 0.20, s * 0.09, s * 0.13, -0.45, 0, TAU); ctx.fill();
  ctx.fillStyle = "#d69b76"; ctx.beginPath(); ctx.arc(cx + s * 0.05, cy - s * 0.36, s * 0.065, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawAccessibleVan(cx, cy, s) {
  const x = cx;
  ctx.save();
  ctx.translate(x, cy);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.fillStyle = "#8fd4ff";
  ctx.strokeStyle = "#28516f";
  ctx.lineWidth = Math.max(2, s * 0.018);
  ctx.beginPath();
  ctx.moveTo(-s * 0.64, -s * 0.15);
  ctx.lineTo(-s * 0.42, -s * 0.38);
  ctx.lineTo(s * 0.52, -s * 0.38);
  ctx.quadraticCurveTo(s * 0.74, -s * 0.32, s * 0.74, -s * 0.08);
  ctx.lineTo(s * 0.74, s * 0.28);
  ctx.lineTo(-s * 0.70, s * 0.28);
  ctx.lineTo(-s * 0.70, -s * 0.15);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#eaf8ff";
  roundRect(ctx, -s * 0.35, -s * 0.31, s * 0.30, s * 0.15, 5); ctx.fill(); ctx.stroke();
  roundRect(ctx, -s * 0.01, -s * 0.31, s * 0.27, s * 0.15, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, s * 0.10, -s * 0.06, s * 0.50, s * 0.20, 6); ctx.fill(); ctx.strokeStyle = "#28516f"; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = "#174e81"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(s * 0.076)}px Arial`;
  ctx.fillText("CASE", s * 0.35, -s * 0.002);
  ctx.font = `bold ${Math.round(s * 0.062)}px Arial`;
  ctx.fillText("Collaborative", s * 0.35, s * 0.060);
  ctx.fillStyle = "#1d2330";
  [-s * 0.42, s * 0.48].forEach((wx) => { ctx.beginPath(); ctx.arc(wx, s * 0.31, s * 0.13, 0, TAU); ctx.fill(); ctx.fillStyle = "#c9d1dc"; ctx.beginPath(); ctx.arc(wx, s * 0.31, s * 0.055, 0, TAU); ctx.fill(); ctx.fillStyle = "#1d2330"; });
  ctx.restore();
}

function drawVanLiftPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / pin.rocket.duration, 0, 1);
  const vanSize = 120;
  const startVanX = layout.wallRight - vanSize * 0.84;
  const vanBaseY = pin.y + 38;
  const drivePhase = clamp((t - 0.70) / 0.30, 0, 1);
  const vanEndX = layout.wallLeft - vanSize * 0.95;
  const vanX = lerp(startVanX, vanEndX, easeInOut(drivePhase));
  drawGroundLineV131(pin.y + 92, "rgba(75,95,115,0.35)");
  if (drivePhase > 0.05) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.70)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    const streakBase = Math.min(view.w - 12, startVanX + vanSize * 0.35);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(streakBase + i * 18, pin.y + 34 + i * 14);
      ctx.lineTo(streakBase + 56 + i * 18, pin.y + 34 + i * 14);
      ctx.stroke();
    }
    ctx.restore();
  }
  drawAccessibleVan(vanX, vanBaseY, vanSize);
  const lower = pin.y + 92;
  const platformBaseX = startVanX - vanSize * 0.88 + easeOut(clamp(t / 0.22, 0, 1)) * 36;
  let platformY = lower;
  if (t > 0.40 && t < 0.62) platformY = lerp(lower, vanBaseY + vanSize * 0.08, easeInOut((t - 0.40) / 0.22));
  if (t >= 0.62) platformY = vanBaseY + vanSize * 0.08;
  const fold = clamp((t - 0.64) / 0.12, 0, 1);
  if (drivePhase < 0.02) {
    ctx.save();
    ctx.strokeStyle = "#4d5f6f";
    ctx.fillStyle = "#c4cbd2";
    ctx.lineWidth = 3;
    const px = platformBaseX + fold * 28;
    const pw = 70 * (1 - fold * 0.65);
    roundRect(ctx, px - 35, platformY - 5, pw, 10, 4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#687785";
    ctx.beginPath(); ctx.moveTo(px - 28, platformY - 5); ctx.lineTo(startVanX - 70, vanBaseY + 7); ctx.moveTo(px + 25, platformY - 5); ctx.lineTo(startVanX - 42, vanBaseY + 7); ctx.stroke();
    ctx.restore();
  }
  const approach = easeOut(clamp(t / 0.32, 0, 1));
  const chairStartX = view.w + 120;
  const chairX = lerp(chairStartX, platformBaseX - 5, approach);
  const chairY = platformY - 14;
  const inside = clamp((t - 0.62) / 0.12, 0, 1);
  const finalX = lerp(chairX, startVanX - 38, easeInOut(inside));
  const alpha = 1 - clamp((t - 0.60) / 0.10, 0, 1);
  if (alpha > 0.02) drawTinyWheelchairForVan(finalX, chairY, 95, age, alpha);
  if (t > 0.60 && t < 0.76) {
    ctx.save();
    ctx.fillStyle = "#ffe36d";
    for (let i = 0; i < 6; i += 1) drawStar(startVanX - 62 + Math.cos(i) * 20, vanBaseY + 16 + Math.sin(i * 1.4) * 16, 5, 2.4, 5);
    ctx.restore();
  }
}

function drawMarbleRunPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  const fade = 1 - clamp((t - 0.92) / 0.08, 0, 1);
  const left = layout.wallLeft;
  const right = layout.wallRight;
  const top = layout.playTop + 6;
  const bottomExit = layout.playBottom + layout.pinH * 0.62;
  const rails = [
    { x1: left + (right - left) * 0.28, y1: top, x2: left + (right - left) * 0.78, y2: top + (layout.playBottom - layout.playTop) * 0.15 },
    { x1: left + (right - left) * 0.78, y1: top + (layout.playBottom - layout.playTop) * 0.15, x2: left + (right - left) * 0.24, y2: top + (layout.playBottom - layout.playTop) * 0.34 },
    { x1: left + (right - left) * 0.24, y1: top + (layout.playBottom - layout.playTop) * 0.34, x2: left + (right - left) * 0.80, y2: top + (layout.playBottom - layout.playTop) * 0.52 },
    { x1: left + (right - left) * 0.80, y1: top + (layout.playBottom - layout.playTop) * 0.52, x2: left + (right - left) * 0.18, y2: top + (layout.playBottom - layout.playTop) * 0.72 },
    { x1: left + (right - left) * 0.18, y1: top + (layout.playBottom - layout.playTop) * 0.72, x2: left + (right - left) * 0.36, y2: bottomExit }
  ];
  const marblePos = (u) => {
    const segT = clamp(u, 0, 1) * rails.length;
    const si = Math.min(rails.length - 1, Math.floor(segT));
    const lt = easeInOut(segT - si);
    const r = rails[si];
    return { x: lerp(r.x1, r.x2, lt), y: lerp(r.y1, r.y2, lt) - 8 };
  };
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = "#7c5b35"; ctx.lineWidth = 9;
  rails.forEach((r) => { ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke(); });
  ctx.strokeStyle = "#d6a561"; ctx.lineWidth = 4;
  rails.forEach((r) => { ctx.beginPath(); ctx.moveTo(r.x1, r.y1 - 5); ctx.lineTo(r.x2, r.y2 - 5); ctx.moveTo(r.x1, r.y1 + 5); ctx.lineTo(r.x2, r.y2 + 5); ctx.stroke(); });
  ctx.fillStyle = "#aa733b";
  rails.forEach((r) => ctx.fillRect(r.x1 - 4, r.y1, 8, 34));
  const colors = [
    ["#fff6f6", "#ffb1b1", "#ef3340", "#932330"],
    ["#f6fff8", "#9af0ab", "#41b75b", "#216937"],
    ["#ffffff", "#7bd7ff", "#348ce6", "#194c91"]
  ];
  for (let i = 0; i < 3; i += 1) {
    const local = t * 3 - i;
    if (local < 0 || local > 1) continue;
    const p = marblePos(local);
    const g = ctx.createRadialGradient(p.x - 5, p.y - 5, 2, p.x, p.y, 13);
    g.addColorStop(0, colors[i][0]); g.addColorStop(0.24, colors[i][1]); g.addColorStop(0.65, colors[i][2]); g.addColorStop(1, colors[i][3]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, TAU); ctx.fill();
    ctx.strokeStyle = colors[i][3]; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

function drawRegularWheelchairBody(cx, cy, s, age, shirt, skin, alpha = 1, tiny = false) {
  const rearR = s * 0.20, frontR = s * 0.075;
  const rearX = cx - s * 0.12, rearY = cy;
  const frontX = cx + s * 0.30, frontY = cy + s * 0.05;
  const push = Math.sin(age / 260);
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = "#1e2632"; ctx.lineWidth = Math.max(2, s * 0.022);
  ctx.beginPath(); ctx.moveTo(rearX, rearY); ctx.lineTo(cx, cy - s * 0.18); ctx.lineTo(frontX, frontY); ctx.lineTo(cx + s * 0.02, cy); ctx.stroke();
  ctx.beginPath(); ctx.arc(rearX, rearY, rearR, 0, TAU); ctx.stroke();
  ctx.strokeStyle = "#7d8793"; ctx.lineWidth = Math.max(1.2, s * 0.010);
  for (let i = 0; i < 8; i += 1) { const a = age / 330 + i * TAU / 8; ctx.beginPath(); ctx.moveTo(rearX, rearY); ctx.lineTo(rearX + Math.cos(a) * rearR * 0.86, rearY + Math.sin(a) * rearR * 0.86); ctx.stroke(); }
  ctx.strokeStyle = "#1e2632"; ctx.lineWidth = Math.max(2, s * 0.020); ctx.beginPath(); ctx.arc(frontX, frontY, frontR, 0, TAU); ctx.stroke();
  ctx.fillStyle = shirt; ctx.beginPath(); ctx.ellipse(cx - s * 0.02, cy - s * 0.22, s * 0.10, s * 0.15, -0.45, 0, TAU); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(cx + s * 0.05, cy - s * 0.40, s * 0.07, 0, TAU); ctx.fill();
  ctx.strokeStyle = skin; ctx.lineWidth = Math.max(3, s * 0.025);
  const handX = rearX + Math.cos(-0.55 + push * 0.32) * rearR * 0.95, handY = rearY + Math.sin(-0.55 + push * 0.32) * rearR * 0.95;
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.25); ctx.lineTo(handX, handY); ctx.stroke();
  if (!tiny) {
    ctx.strokeStyle = "#202731"; ctx.lineWidth = Math.max(4, s * 0.035);
    ctx.beginPath(); ctx.moveTo(cx - s * 0.05, cy - s * 0.08); ctx.lineTo(cx + s * 0.14, cy + s * 0.04); ctx.stroke();
  }
  ctx.restore();
}

function drawRegularWheelchairPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  const e = easeInOut(t);
  const s = layout.pinH * 2.40;
  const x = lerp(layout.wallLeft - s * 0.70, layout.wallRight + s * 0.70, e);
  const y = pin.y + layout.pinH * 0.72;
  drawGroundLineV131(y + layout.pinH * 0.40);
  drawForwardArrowTrail(x - s * 0.44, y + s * 0.06, x + s * 0.18, y + s * 0.06, "rgba(255,255,255,0.34)");
  drawRegularWheelchairBody(x, y, s, age, "#4f7bd9", "#c88f6b");
}

function drawGiraffeWalker(cx, cy, s, age) {
  const step = Math.sin(age / 180);
  ctx.save(); ctx.translate(cx, cy); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.fillStyle = "#e8c16b"; ctx.strokeStyle = "#9d6b2e"; ctx.lineWidth = Math.max(2, s * 0.014);
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.24, s * 0.16, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.10, -s * 0.06); ctx.lineTo(s * 0.20, -s * 0.62); ctx.lineTo(s * 0.28, -s * 0.62); ctx.lineTo(s * 0.22, -s * 0.02); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(s * 0.26, -s * 0.70, s * 0.12, s * 0.09, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.24, -s * 0.80); ctx.lineTo(s * 0.22, -s * 0.92); ctx.moveTo(s * 0.32, -s * 0.78); ctx.lineTo(s * 0.34, -s * 0.90); ctx.stroke();
  ctx.fillStyle = "#784d21";
  [[-s * 0.10,-s * 0.02],[s * 0.06,s * 0.06],[s * 0.03,-s * 0.08],[s * 0.17,-s * 0.20],[-s * 0.04,-s * 0.14],[s * 0.28,-s * 0.65]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(dx, dy, s * 0.04, s * 0.03, 0, 0, TAU); ctx.fill(); });
  ctx.strokeStyle = "#9d6b2e"; ctx.lineWidth = Math.max(4, s * 0.03);
  ctx.beginPath(); ctx.moveTo(-s * 0.10, s * 0.08); ctx.lineTo(-s * 0.12, s * 0.42 + step * s * 0.05); ctx.moveTo(s * 0.02, s * 0.08); ctx.lineTo(0, s * 0.42 - step * s * 0.05); ctx.moveTo(s * 0.12, s * 0.08); ctx.lineTo(s * 0.16, s * 0.44 - step * s * 0.04); ctx.moveTo(s * 0.22, s * 0.03); ctx.lineTo(s * 0.26, s * 0.40 + step * s * 0.05); ctx.stroke();
  ctx.strokeStyle = "#7a5427"; ctx.beginPath(); ctx.moveTo(-s * 0.24, -s * 0.04); ctx.lineTo(-s * 0.36, -s * 0.14 + step * s * 0.04); ctx.stroke();
  ctx.restore();
}

function drawGiraffeWalkPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  const e = easeInOut(t);
  const s = layout.pinH * 1.76;
  const x = lerp(layout.wallRight + s * 0.60, layout.wallLeft - s * 0.55, e);
  const y = pin.y + s * 0.36;
  drawGroundLineV131(y + s * 0.30);
  drawForwardArrowTrail(x + s * 0.38, y + s * 0.27, x + s * 0.05, y + s * 0.27, "rgba(255,255,255,0.30)");
  drawGiraffeWalker(x, y, s, age);
}

function drawElephantWalker(cx, cy, s, age) {
  const step = Math.sin(age / 180);
  const trunkWave = Math.sin(age / 420);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#8e95a3";
  ctx.strokeStyle = "#5d6675";
  ctx.lineWidth = Math.max(2, s * 0.014);
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.30, s * 0.20, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(s * 0.22, -s * 0.07, s * 0.15, s * 0.13, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#a2a9b6";
  ctx.beginPath(); ctx.ellipse(s * 0.10, -s * 0.03, s * 0.10, s * 0.12, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#8e95a3";
  [[-0.16,-step*0.04],[-0.04,step*0.03],[0.08,step*0.03],[0.20,-step*0.04]].forEach(([lx, off]) => {
    roundRect(ctx, s * lx - s * 0.04, s * (0.12 + off), s * 0.08, s * 0.24, s * 0.03); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#778091"; roundRect(ctx, s * lx - s * 0.045, s * (0.33 + off), s * 0.09, s * 0.045, s * 0.02); ctx.fill(); ctx.fillStyle = "#8e95a3";
  });
  ctx.strokeStyle = "#5d6675"; ctx.lineWidth = Math.max(3, s * 0.020);
  ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 0.04); ctx.quadraticCurveTo(-s * 0.38, s * 0.02, -s * 0.36, s * 0.12); ctx.stroke();
  ctx.fillStyle = "#5d6675"; ctx.beginPath(); ctx.moveTo(-s * 0.36, s * 0.12); ctx.lineTo(-s * 0.32, s * 0.15); ctx.lineTo(-s * 0.35, s * 0.18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#24314f"; ctx.beginPath(); ctx.arc(s * 0.27, -s * 0.09, s * 0.014, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#f3ede3"; ctx.lineWidth = Math.max(2, s * 0.018);
  ctx.beginPath(); ctx.moveTo(s * 0.29, -s * 0.02); ctx.quadraticCurveTo(s * 0.38, -s * 0.01, s * 0.37, s * 0.06); ctx.stroke();
  ctx.fillStyle = "#8e95a3"; ctx.strokeStyle = "#5d6675"; ctx.lineWidth = Math.max(2, s * 0.012);
  const bx = s * 0.33, by = 0, tipX = s * (0.36 + trunkWave * 0.08), tipY = s * (0.18 - Math.cos(age / 500) * 0.10);
  ctx.beginPath();
  ctx.moveTo(bx - s * 0.03, by - s * 0.01);
  ctx.bezierCurveTo(s * 0.44, s * 0.04, s * 0.46 + trunkWave * s * 0.05, s * 0.10, tipX + s * 0.03, tipY - s * 0.02);
  ctx.quadraticCurveTo(tipX + s * 0.05, tipY + s * 0.05, tipX, tipY + s * 0.06);
  ctx.quadraticCurveTo(s * 0.43 + trunkWave * s * 0.04, s * 0.15, s * 0.34, s * 0.03);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(93,102,117,0.45)'; ctx.lineWidth = Math.max(1, s * 0.006);
  for (let i = 0; i < 4; i += 1) {
    const py = s * (0.05 + i * 0.04);
    ctx.beginPath(); ctx.moveTo(s * (0.35 + i * 0.01), py); ctx.quadraticCurveTo(s * 0.40 + trunkWave * s * 0.03, py + s * 0.01, s * 0.44 + trunkWave * s * 0.04, py + s * 0.03); ctx.stroke();
  }
  ctx.restore();
}

function drawElephantWavePin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  const e = easeInOut(t);
  const s = layout.pinH * 1.86;
  const x = lerp(layout.wallLeft - s * 0.70, layout.wallRight + s * 0.70, e);
  const y = pin.y + s * 0.42;
  drawGroundLineV131(y + s * 0.36, "rgba(136,150,102,0.25)");
  drawElephantWalker(x, y, s, age);
}


function drawGameSun(cx, cy, r, age = 0, rayAlpha = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = `rgba(255,205,46,${0.95 * rayAlpha})`;
  ctx.lineWidth = 4;
  for (let i = 0; i < 12; i += 1) {
    const a = age / 1200 + i * TAU / 12;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r + 3), Math.sin(a) * (r + 3));
    ctx.lineTo(Math.cos(a) * (r + 14), Math.sin(a) * (r + 14));
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
  g.addColorStop(0, "#fff7b4");
  g.addColorStop(0.55, "#ffd94d");
  g.addColorStop(1, "#f5ad10");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.fillStyle = "#d07b00";
  ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.10, r * 0.08, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.28, -r * 0.10, r * 0.08, 0, TAU); ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#d07b00";
  ctx.beginPath(); ctx.arc(0, r * 0.08, r * 0.32, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.restore();
}

function drawGamePlanet(cx, cy, r, color, ring = false) {
  ctx.save();
  ctx.translate(cx, cy);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 2, 0, 0, r);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.3, color);
  g.addColorStop(1, "rgba(0,0,0,.25)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  if (ring) {
    ctx.strokeStyle = "rgba(230,220,180,.9)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * 0.7, 0.3, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

function drawHeartOutlinePin(centerX, centerY, scale, progress) {
  const heartPoint = (t) => {
    const a = TAU * t;
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    return { x: centerX + x * scale, y: centerY + y * scale };
  };
  ctx.strokeStyle = "#eb3556";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  const steps = Math.max(2, Math.floor(progress * 140));
  for (let i = 0; i <= steps; i += 1) {
    const p = heartPoint(i / 140);
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

function drawHeartDrawPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  const progress = clamp(t / 0.78, 0, 1);
  const centerX = lerp(layout.wallLeft + 60, layout.wallRight - 60, 0.5);
  const centerY = lerp(layout.playTop + 70, layout.playBottom - 70, 0.55);
  drawHeartOutlinePin(centerX, centerY, layout.pinH * 0.095, progress);
}

function drawSunTravelPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  const travelT = clamp((t - 0.22) / 0.78, 0, 1);
  const y = layout.playTop + layout.pinH * 0.9;
  const r = layout.pinH * 0.42;
  const startX = layout.wallLeft + layout.pinH * 0.85;
  const endX = layout.wallRight - layout.pinH * 0.85;
  const sunX = travelT > 0 ? lerp(startX, endX, easeInOut(travelT)) : startX + layout.pinH * 0.7;
  drawGameSun(sunX, y, r, age);
}

function drawSunPlanetsPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  const startX = layout.wallLeft + layout.pinH * 1.0;
  const startY = layout.playTop + layout.pinH * 0.85;
  const centerX = lerp(layout.wallLeft, layout.wallRight, 0.50);
  const centerY = lerp(layout.playTop, layout.playBottom, 0.47);
  const moveT = clamp((t - 0.18) / 0.24, 0, 1);
  const orbitT = clamp((t - 0.42) / 0.58, 0, 1);
  const sx = lerp(startX, centerX, easeInOut(moveT));
  const sy = lerp(startY, centerY, easeInOut(moveT));
  drawGameSun(sx, sy, layout.pinH * 0.42, age);
  if (orbitT > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.30)";
    ctx.lineWidth = 1.7;
    const base = layout.pinH * 0.68;
    const orbits = [base * 0.55, base * 0.72, base * 0.88, base * 1.05, base * 1.22, base * 1.40, base * 1.57, base * 1.74, base * 1.95];
    orbits.forEach((r) => { ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.42, 0, 0, TAU); ctx.stroke(); });
    ctx.restore();
    const planets = [
      { r: base * 0.55, size: 3, color: "#f0c34a", speed: 1.8, phase: 0.2 },
      { r: base * 0.72, size: 5, color: "#d9c8a9", speed: 1.4, phase: 1.1 },
      { r: base * 0.88, size: 5, color: "#6ec2ff", speed: 1.1, phase: 2.0 },
      { r: base * 1.05, size: 4, color: "#c86b44", speed: 0.95, phase: 2.8 },
      { r: base * 1.22, size: 13, color: "#f7c663", speed: 0.75, phase: 3.7 },
      { r: base * 1.40, size: 12, color: "#e2c997", speed: 0.62, phase: 4.5, ring: true },
      { r: base * 1.57, size: 8, color: "#8ad5df", speed: 0.48, phase: 5.1 },
      { r: base * 1.74, size: 8, color: "#5876ff", speed: 0.38, phase: 0.9 },
      { r: base * 1.95, size: 7, color: "#8b7de8", speed: 0.28, phase: 5.6 }
    ];
    planets.forEach((p) => {
      const a = orbitT * TAU * p.speed + p.phase;
      drawGamePlanet(sx + Math.cos(a) * p.r, sy + Math.sin(a) * (p.r * 0.42), p.size, p.color, !!p.ring);
    });
  }
}

function drawDandelionStemPin(baseX, baseY, grow) {
  const stemH = lerp(8, layout.pinH * 1.95, grow);
  ctx.strokeStyle = "#3e9b38";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + 8, baseY - stemH * 0.45, baseX, baseY - stemH);
  ctx.stroke();
  ctx.strokeStyle = "#56ad49";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(baseX, baseY - stemH * 0.28); ctx.quadraticCurveTo(baseX - 18, baseY - stemH * 0.36, baseX - 32, baseY - stemH * 0.30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(baseX, baseY - stemH * 0.56); ctx.quadraticCurveTo(baseX + 16, baseY - stemH * 0.68, baseX + 28, baseY - stemH * 0.60); ctx.stroke();
  return { x: baseX, y: baseY - stemH };
}

function drawDandelionBloomPin(cx, cy, progress) {
  const petalCount = 34;
  const outer = lerp(8, layout.pinH * 0.64, progress);
  for (let i = 0; i < petalCount; i += 1) {
    const a = i * TAU / petalCount;
    const len = outer * (0.85 + 0.18 * Math.sin(i));
    ctx.strokeStyle = "#f3cd26";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, layout.pinH * 0.26);
  g.addColorStop(0, "#fff4a9");
  g.addColorStop(0.55, "#ffd94d");
  g.addColorStop(1, "#df9f02");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, layout.pinH * 0.20, 0, TAU); ctx.fill();
}

function drawDandelionSeedHeadPin(cx, cy, blowT) {
  ctx.strokeStyle = "rgba(206,210,216,.96)";
  ctx.lineWidth = 1.3;
  const headR = layout.pinH * 0.46;
  for (let i = 0; i < 28; i += 1) {
    const a = i * TAU / 28;
    const drift = Math.max(0, (blowT - i / 34) * layout.pinH * 2.2);
    const ox = Math.cos(a) * headR + drift;
    const oy = Math.sin(a) * headR - drift * 0.08;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ox, cy + oy); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + ox, cy + oy); ctx.lineTo(cx + ox - 5, cy + oy - 7);
    ctx.moveTo(cx + ox, cy + oy); ctx.lineTo(cx + ox + 5, cy + oy - 7);
    ctx.moveTo(cx + ox, cy + oy); ctx.lineTo(cx + ox, cy + oy - 8);
    ctx.stroke();
    ctx.fillStyle = "rgba(196,160,90,.85)";
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, 1.5, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = "#b28d4e";
  ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, TAU); ctx.fill();
}

function drawDandelionLifePin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  drawGroundLineV131(layout.playBottom - layout.pinH * 0.15, "rgba(99,160,87,.33)");
  const growT = clamp(t / 0.18, 0, 1);
  const bloomT = clamp((t - 0.18) / 0.20, 0, 1);
  const wiltT = clamp((t - 0.46) / 0.16, 0, 1);
  const blowT = clamp((t - 0.64) / 0.36, 0, 1);
  const head = drawDandelionStemPin(lerp(layout.wallLeft, layout.wallRight, 0.50), layout.playBottom - layout.pinH * 0.18, growT);
  if (t < 0.46) {
    drawDandelionBloomPin(head.x, head.y, bloomT);
  } else {
    drawDandelionSeedHeadPin(head.x, head.y, blowT);
    const fadeBloom = 1 - wiltT;
    if (fadeBloom > 0.05) {
      ctx.save();
      ctx.globalAlpha = fadeBloom * 0.45;
      drawDandelionBloomPin(head.x, head.y, 1);
      ctx.restore();
    }
  }
}

function drawFireTruckBody(x, y, age) {
  const s = layout.pinH * 1.62;
  const wheelSpin = age / 120;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.fillStyle = "#d9272e";
  ctx.strokeStyle = "#8e161a";
  ctx.lineWidth = 2.5;
  roundRect(ctx, -s * 0.56, -s * 0.16, s * 0.78, s * 0.32, 8); ctx.fill(); ctx.stroke();
  roundRect(ctx, s * 0.10, -s * 0.10, s * 0.34, s * 0.26, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#dff3ff";
  roundRect(ctx, s * 0.14, -s * 0.08, s * 0.11, s * 0.10, 3); ctx.fill(); ctx.stroke();
  roundRect(ctx, s * 0.26, -s * 0.08, s * 0.11, s * 0.10, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f1f1f1";
  roundRect(ctx, -s * 0.48, -s * 0.03, s * 0.58, s * 0.06, 3); ctx.fill();
  ctx.fillStyle = "#c9c9c9";
  for (let i = 0; i < 4; i += 1) { roundRect(ctx, -s * 0.44 + i * s * 0.14, -s * 0.11, s * 0.10, s * 0.08, 2); ctx.fill(); }
  ctx.strokeStyle = "#c7c7c7"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-s * 0.20, -s * 0.24); ctx.lineTo(s * 0.18, -s * 0.24); ctx.stroke();
  ctx.fillStyle = "#ffd14b"; ctx.beginPath(); ctx.arc(s * 0.32, -s * 0.14, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = "#6ec6ff"; ctx.beginPath(); ctx.arc(s * 0.40, -s * 0.14, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = "#1d2330";
  [[-s * 0.28, s * 0.18], [s * 0.22, s * 0.18]].forEach(([wx, wy]) => {
    ctx.beginPath(); ctx.arc(wx, wy, s * 0.11, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#77818f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wx, wy, s * 0.055, 0, TAU); ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const a = wheelSpin + i * TAU / 6;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * s * 0.055, wy + Math.sin(a) * s * 0.055); ctx.stroke();
    }
    ctx.strokeStyle = "#8e161a";
  });
  ctx.restore();
}

function drawFireTruckPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const t = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  const e = easeInOut(t);
  const s = layout.pinH * 1.62;
  const x = lerp(layout.wallLeft - s * 0.9, layout.wallRight + s * 0.9, e);
  const y = pin.y + layout.pinH * 0.78;
  drawGroundLineV131(y + layout.pinH * 0.30);
  drawForwardArrowTrail(x - s * 0.52, y + s * 0.18, x + s * 0.20, y + s * 0.18, "rgba(255,255,255,0.30)");
  drawFireTruckBody(x, y, age);
}

function drawCrutchesGalleryLine(x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawCrutchesGalleryShoe(x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  roundRect(ctx, -size * 0.18, -size * 0.055, size * 0.36, size * 0.11, size * 0.055);
  ctx.fill();
  ctx.restore();
}

function drawUnderarmCrutch(shoulderX, shoulderY, handX, handY, tipX, tipY, side, planted, scale) {
  const railSpreadTop = 7 * scale;
  const railSpreadBottom = 4 * scale;
  const padWidth = 30 * scale;
  const padHeight = 9 * scale;
  const shaftWidth = (planted ? 5 : 4) * scale;
  const railColor = planted ? "#4d6172" : "#627687";
  ctx.save();
  drawCrutchesGalleryLine(shoulderX - side * railSpreadTop, shoulderY + 6 * scale, tipX - side * railSpreadBottom, tipY - 11 * scale, shaftWidth, railColor);
  drawCrutchesGalleryLine(shoulderX + side * railSpreadTop, shoulderY + 6 * scale, tipX + side * railSpreadBottom, tipY - 11 * scale, shaftWidth, railColor);
  drawCrutchesGalleryLine(handX - side * 10 * scale, handY, handX + side * 10 * scale, handY, 5 * scale, "#34495a");
  drawCrutchesGalleryLine((handX + tipX) / 2, (handY + tipY) / 2, tipX, tipY - 5 * scale, shaftWidth + 1, "#536879");
  ctx.save();
  ctx.translate(shoulderX, shoulderY);
  ctx.rotate(side * 0.04);
  ctx.fillStyle = "#cad6df";
  ctx.strokeStyle = "#536879";
  ctx.lineWidth = 2 * scale;
  roundRect(ctx, -padWidth / 2, -padHeight / 2, padWidth, padHeight, 5 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#263746";
  roundRect(ctx, tipX - 10 * scale, tipY - 5 * scale, 20 * scale, 9 * scale, 4 * scale);
  ctx.fill();
  if (planted) {
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.ellipse(tipX, tipY + 3 * scale, 20 * scale, 5 * scale, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawUnderarmCrutchesWalkPin(pin, current) {
  const age = current - pin.rocket.startedAt;
  const travelCycle = clamp(age / Math.max(1, pin.rocket.duration), 0, 1);
  const gaitCycle = (travelCycle * 2) % 1;
  const crutchesAdvancePhase = gaitCycle >= 0.20 && gaitCycle < 0.28;
  const weightBearingPhase = gaitCycle >= 0.28 && gaitCycle < 0.56;
  const feetAdvancePhase = gaitCycle >= 0.40 && gaitCycle < 0.64;
  const crutchAdvanceT = easeInOut(clamp((gaitCycle - 0.20) / 0.08, 0, 1));
  const bodyPassT = easeInOut(clamp((gaitCycle - 0.28) / 0.28, 0, 1));
  const footAdvanceT = easeInOut(clamp((gaitCycle - 0.40) / 0.24, 0, 1));
  const recoveryT = easeInOut(clamp((gaitCycle - 0.64) / 0.36, 0, 1));
  const crutchPoseT = crutchAdvanceT * (1 - recoveryT);
  const bodyPoseT = bodyPassT * (1 - recoveryT);
  const footPoseT = footAdvanceT * (1 - recoveryT);
  const scale = layout.pinH / 155;
  const stageW = layout.pinH * 4.2;
  const groundY = pin.y + layout.pinH * 1.05;
  const travelStart = pin.x - stageW * 0.96;
  const travelEnd = pin.x + stageW * 0.48;
  const x = lerp(travelStart, travelEnd, travelCycle);
  const unit = 16 * scale;
  const headR = 18 * scale;
  const neckH = unit * 0.32;
  const torsoH = unit * 3;
  const legH = unit * 4;
  const stepLength = 64 * scale;
  const crutchLift = crutchesAdvancePhase ? Math.sin(crutchAdvanceT * Math.PI) * 16 * scale : 0;
  const footLift = feetAdvancePhase ? Math.sin(footAdvanceT * Math.PI) * 8 * scale : 0;
  const supportPress = weightBearingPhase ? Math.sin(clamp((gaitCycle - 0.28) / 0.28, 0, 1) * Math.PI) : 0;
  const y = groundY - legH + supportPress * 4 * scale - recoveryT * 2 * scale;
  const hipX = x - 12 * scale + bodyPoseT * 28 * scale;
  const hipY = y;
  const chestX = hipX + 4 * scale + supportPress * 5 * scale;
  const shoulderY = hipY - torsoH + supportPress * 3 * scale;
  const neckTopY = shoulderY - neckH;
  const headX = chestX;
  const headY = neckTopY - headR;
  const leftFootX = x - 26 * scale + footPoseT * stepLength;
  const rightFootX = x + 10 * scale + footPoseT * stepLength * 0.92;
  const leftFootY = groundY - footLift;
  const rightFootY = groundY - footLift * 0.72;
  const leftShoulderX = chestX - 24 * scale;
  const rightShoulderX = chestX + 24 * scale;
  const crutchTopY = shoulderY + 11 * scale;
  const leftCrutchTopX = leftShoulderX + 8 * scale;
  const rightCrutchTopX = rightShoulderX - 8 * scale;
  const crutchBaseX = x + 34 * scale;
  const leftTipX = crutchBaseX - 76 * scale + crutchPoseT * stepLength;
  const rightTipX = crutchBaseX - 14 * scale + crutchPoseT * stepLength;
  const crutchTipY = groundY - crutchLift;
  const crutchGripT = 0.44;
  const leftCrutchHandX = lerp(leftCrutchTopX, leftTipX, crutchGripT);
  const rightCrutchHandX = lerp(rightCrutchTopX, rightTipX, crutchGripT);
  const crutchHandY = lerp(crutchTopY, crutchTipY, crutchGripT);
  const crutchesPlanted = !crutchesAdvancePhase;

  ctx.save();
  ctx.globalAlpha = 1 - clamp((travelCycle - 0.92) / 0.08, 0, 1);
  drawGroundLineV131(groundY + 6 * scale, "rgba(90,110,130,0.26)");
  ctx.save();
  ctx.globalAlpha *= 0.22;
  ctx.fillStyle = "#315c77";
  ctx.beginPath();
  ctx.ellipse(hipX + 10 * scale, groundY + 8 * scale, 82 * scale, 13 * scale, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  drawUnderarmCrutch(leftCrutchTopX, crutchTopY, leftCrutchHandX, crutchHandY, leftTipX, crutchTipY, -1, crutchesPlanted, 1.18 * scale);
  drawUnderarmCrutch(rightCrutchTopX, crutchTopY, rightCrutchHandX, crutchHandY, rightTipX, crutchTipY, 1, crutchesPlanted, 1.18 * scale);
  ctx.fillStyle = "#ffb05f";
  ctx.strokeStyle = "#9a5a2a";
  ctx.lineWidth = 3 * scale;
  roundRect(ctx, chestX - 25 * scale, shoulderY - 2 * scale, 50 * scale, torsoH + 8 * scale, 16 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d89a72";
  ctx.strokeStyle = "#9a6a52";
  ctx.lineWidth = 2 * scale;
  roundRect(ctx, headX - 6 * scale, neckTopY - 1 * scale, 12 * scale, neckH + 7 * scale, 5 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#315e8f";
  ctx.strokeStyle = "#244a73";
  ctx.lineWidth = 2 * scale;
  roundRect(ctx, hipX - 24 * scale, hipY - 8 * scale, 50 * scale, 18 * scale, 8 * scale);
  ctx.fill();
  ctx.stroke();
  drawCrutchesGalleryLine(hipX - 13 * scale, hipY + 4 * scale, leftFootX, leftFootY - 7 * scale, 11 * scale, "#315e8f");
  drawCrutchesGalleryLine(hipX + 13 * scale, hipY + 4 * scale, rightFootX, rightFootY - 7 * scale, 11 * scale, "#315e8f");
  drawCrutchesGalleryShoe(leftFootX, leftFootY, (footAdvanceT - 0.5) * 0.12, 90 * scale, "#25364a");
  drawCrutchesGalleryShoe(rightFootX, rightFootY, (footAdvanceT - 0.5) * 0.08, 90 * scale, "#25364a");
  drawCrutchesGalleryLine(chestX - 20 * scale, shoulderY + 9 * scale, leftCrutchHandX, crutchHandY, (weightBearingPhase ? 9 : 8) * scale, "#d89a72");
  drawCrutchesGalleryLine(chestX + 20 * scale, shoulderY + 9 * scale, rightCrutchHandX, crutchHandY, (weightBearingPhase ? 9 : 8) * scale, "#d89a72");
  ctx.fillStyle = "#d89a72";
  ctx.beginPath();
  ctx.arc(leftCrutchHandX, crutchHandY, 6 * scale, 0, TAU);
  ctx.arc(rightCrutchHandX, crutchHandY, 6 * scale, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#5f4437";
  ctx.beginPath();
  ctx.arc(headX - 2 * scale, headY - headR * 0.45, headR, Math.PI * 1.02, Math.PI * 1.92);
  ctx.lineTo(headX + headR * 0.72, headY - headR * 0.45);
  ctx.fill();
  ctx.fillStyle = "#263746";
  ctx.beginPath();
  ctx.arc(headX + 6 * scale, headY - scale, 2 * scale, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#7a4d37";
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.arc(headX + 6 * scale, headY + 5 * scale, 5 * scale, 0.2, 1.6);
  ctx.stroke();
  ctx.restore();
}

  // =====================================================
  // APPROVED CONNECTED-TRAIN AND FRIENDLY-DRAGON DRAWING
  // =====================================================
    const TRAINLINKED_DURATION_MS = 6000;
  
  function trainlinkedClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  function trainlinkedLerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  function trainlinkedEaseInOut(t) {
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  
  function trainlinkedDrawWheel(ctx, x, y, radius, spin, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#5d6a78';
    ctx.strokeStyle = '#263241';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(spin);
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius * 0.82, 0);
      ctx.stroke();
      ctx.rotate(Math.PI * 0.5);
    }
    ctx.restore();
  }
  
  function trainlinkedDrawCoupler(ctx, leftCarEndX, rightCarEndX, y, scale) {
    const centerY = y - 42 * scale;
    ctx.save();
    ctx.strokeStyle = '#404c57';
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(leftCarEndX, centerY);
    ctx.lineTo(rightCarEndX, centerY);
    ctx.stroke();
  
    ctx.fillStyle = '#58646f';
    ctx.strokeStyle = '#2a3540';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(leftCarEndX, centerY, 4.5 * scale, 0, Math.PI * 2);
    ctx.arc(rightCarEndX, centerY, 4.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  
    ctx.beginPath();
    ctx.arc((leftCarEndX + rightCarEndX) * 0.5, centerY, 3.2 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  
  function trainlinkedDrawEngine(ctx, frontX, y, scale, spin, smokeT) {
    ctx.save();
    ctx.fillStyle = '#d95f3f';
    ctx.strokeStyle = '#8d3720';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.roundRect(frontX - 164 * scale, y - 82 * scale, 110 * scale, 52 * scale, 10 * scale);
    ctx.fill();
    ctx.stroke();
  
    ctx.fillStyle = '#efb64c';
    ctx.beginPath();
    ctx.roundRect(frontX - 106 * scale, y - 126 * scale, 44 * scale, 44 * scale, 9 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#97d3f6';
    ctx.fillRect(frontX - 99 * scale, y - 118 * scale, 28 * scale, 20 * scale);
  
    ctx.fillStyle = '#efb64c';
    ctx.beginPath();
    ctx.roundRect(frontX - 48 * scale, y - 100 * scale, 20 * scale, 38 * scale, 6 * scale);
    ctx.fill();
    ctx.stroke();
    trainlinkedDrawWheel(ctx, frontX - 138 * scale, y - 16 * scale, 16 * scale, spin, scale);
    trainlinkedDrawWheel(ctx, frontX - 82 * scale, y - 16 * scale, 16 * scale, spin, scale);
  
    for (let i = 0; i < 3; i += 1) {
      const puffT = trainlinkedClamp(smokeT - i * 0.15, 0, 1);
      if (puffT <= 0) continue;
      const puffX = frontX - 36 * scale + puffT * 20 * scale + i * 8 * scale;
      const puffY = y - 128 * scale - puffT * 46 * scale;
      const puffR = (8 + 11 * puffT) * scale;
      ctx.save();
      ctx.fillStyle = 'rgba(218, 225, 232,' + (0.36 - 0.20 * puffT).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
      ctx.arc(puffX + 9 * scale, puffY + 3 * scale, puffR * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  
  function trainlinkedDrawPassengerCar(ctx, frontX, y, scale, spin) {
    ctx.save();
    ctx.fillStyle = '#4f80c7';
    ctx.strokeStyle = '#2a5287';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.roundRect(frontX - 150 * scale, y - 78 * scale, 120 * scale, 48 * scale, 10 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c0ddf6';
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(frontX - 138 * scale + i * 26 * scale, y - 66 * scale, 15 * scale, 18 * scale);
    }
    trainlinkedDrawWheel(ctx, frontX - 122 * scale, y - 16 * scale, 15 * scale, spin, scale);
    trainlinkedDrawWheel(ctx, frontX - 68 * scale, y - 16 * scale, 15 * scale, spin, scale);
    ctx.restore();
  }
  
  function trainlinkedDrawFreightCar(ctx, frontX, y, scale, spin) {
    ctx.save();
    ctx.fillStyle = '#5aaf71';
    ctx.strokeStyle = '#2d7343';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.roundRect(frontX - 150 * scale, y - 78 * scale, 120 * scale, 48 * scale, 8 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#2d7343';
    ctx.lineWidth = 2 * scale;
    for (let i = 1; i < 3; i += 1) {
      const x = frontX - 150 * scale + i * 40 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y - 78 * scale);
      ctx.lineTo(x, y - 30 * scale);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(frontX - 150 * scale, y - 54 * scale);
    ctx.lineTo(frontX - 30 * scale, y - 54 * scale);
    ctx.stroke();
    trainlinkedDrawWheel(ctx, frontX - 122 * scale, y - 16 * scale, 15 * scale, spin, scale);
    trainlinkedDrawWheel(ctx, frontX - 68 * scale, y - 16 * scale, 15 * scale, spin, scale);
    ctx.restore();
  }
  
  function trainlinkedDrawCaboose(ctx, frontX, y, scale, spin) {
    ctx.save();
    ctx.fillStyle = '#c45658';
    ctx.strokeStyle = '#7d2d32';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.roundRect(frontX - 138 * scale, y - 74 * scale, 102 * scale, 44 * scale, 9 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(frontX - 110 * scale, y - 112 * scale, 42 * scale, 38 * scale, 8 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3d88a';
    ctx.fillRect(frontX - 99 * scale, y - 100 * scale, 20 * scale, 16 * scale);
    trainlinkedDrawWheel(ctx, frontX - 112 * scale, y - 16 * scale, 15 * scale, spin, scale);
    trainlinkedDrawWheel(ctx, frontX - 64 * scale, y - 16 * scale, 15 * scale, spin, scale);
    ctx.restore();
  }
  
  function trainlinkedDrawAnimation(ctx, x, y, scale, elapsed, duration) {
    const progress = trainlinkedClamp(elapsed / duration, 0, 1);
    const wheelSpin = progress * Math.PI * 10;
    const smokeT = (elapsed % 1200) / 1200;
  
    const engineFrontX = x;
    // v3 correction: increase the engine-to-passenger spacing so the first coupler is
    // exactly the same 25 CSS-pixel length as the passenger-to-freight coupler at scale 1.
    const passengerFrontX = engineFrontX - 159 * scale;
    const freightFrontX = passengerFrontX - 145 * scale;
    const cabooseFrontX = freightFrontX - 145 * scale;
  
    trainlinkedDrawEngine(ctx, engineFrontX, y, scale, wheelSpin, smokeT);
    trainlinkedDrawPassengerCar(ctx, passengerFrontX, y, scale, wheelSpin);
    trainlinkedDrawFreightCar(ctx, freightFrontX, y, scale, wheelSpin);
    trainlinkedDrawCaboose(ctx, cabooseFrontX, y, scale, wheelSpin);
  
    trainlinkedDrawCoupler(ctx, engineFrontX - 164 * scale, passengerFrontX - 30 * scale, y, scale);
    trainlinkedDrawCoupler(ctx, passengerFrontX - 150 * scale, freightFrontX - 30 * scale, y, scale);
    trainlinkedDrawCoupler(ctx, freightFrontX - 150 * scale, cabooseFrontX - 36 * scale, y, scale);
  }

  function dragonfirev5Clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function dragonfirev5Lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dragonfirev5EaseInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function dragonfirev5EaseOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function dragonfirev5DrawFlame(ctx, x, y, scale, sizeT, alphaT) {
    if (sizeT <= 0 || alphaT <= 0) return;
    const length = (56 + 150 * sizeT) * scale;
    const spread = (18 + 22 * sizeT) * scale;
    const flameAlpha = 0.95 * alphaT;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255, 178, 58,' + flameAlpha.toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.28, -spread * 1.10, length * 0.60, -spread * 0.78);
    ctx.quadraticCurveTo(length * 0.86, -spread * 0.24, length, 0);
    ctx.quadraticCurveTo(length * 0.84, spread * 0.30, length * 0.58, spread * 0.82);
    ctx.quadraticCurveTo(length * 0.28, spread * 1.10, 0, 0);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 106, 34,' + (flameAlpha * 0.90).toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(6 * scale, 0);
    ctx.quadraticCurveTo(length * 0.24, -spread * 0.72, length * 0.52, -spread * 0.46);
    ctx.quadraticCurveTo(length * 0.76, -spread * 0.14, length * 0.88, 0);
    ctx.quadraticCurveTo(length * 0.76, spread * 0.16, length * 0.52, spread * 0.48);
    ctx.quadraticCurveTo(length * 0.24, spread * 0.72, 6 * scale, 0);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 236, 130,' + (flameAlpha * 0.86).toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(10 * scale, 0);
    ctx.quadraticCurveTo(length * 0.20, -spread * 0.36, length * 0.40, -spread * 0.22);
    ctx.quadraticCurveTo(length * 0.58, -spread * 0.06, length * 0.70, 0);
    ctx.quadraticCurveTo(length * 0.58, spread * 0.08, length * 0.40, spread * 0.24);
    ctx.quadraticCurveTo(length * 0.20, spread * 0.38, 10 * scale, 0);
    ctx.fill();
    ctx.restore();
  }

  function dragonfirev5DrawSparkles(ctx, x, y, scale, sparkleT) {
    if (sparkleT <= 0) return;
    const alpha = 0.92 * (1 - sparkleT);
    const drift = 44 * sparkleT * scale;
    const sparkleScale = (1 + 0.42 * sparkleT) * scale;
    const sparkles = [
      { x: 52, y: -10, size: 4.5, color: [120, 190, 255] },
      { x: 58, y: -24, size: 5.0, color: [181, 126, 255] },
      { x: 62, y: 8, size: 4.2, color: [255, 231, 92] },
      { x: 68, y: -36, size: 5.2, color: [255, 184, 85] },
      { x: 72, y: -6, size: 4.8, color: [255, 146, 112] },
      { x: 76, y: -20, size: 5.0, color: [210, 170, 255] },
      { x: 82, y: 14, size: 4.5, color: [255, 240, 168] },
      { x: 86, y: -30, size: 5.0, color: [132, 204, 255] },
      { x: 90, y: -2, size: 4.5, color: [255, 210, 110] },
      { x: 94, y: -18, size: 5.0, color: [169, 120, 255] },
      { x: 98, y: -34, size: 5.2, color: [255, 245, 176] },
      { x: 102, y: 6, size: 4.6, color: [255, 173, 120] },
      { x: 108, y: -14, size: 4.8, color: [255, 224, 118] },
      { x: 112, y: -36, size: 6.0, color: [255, 244, 170] },
      { x: 116, y: 12, size: 4.4, color: [120, 190, 255] },
      { x: 120, y: 4, size: 5.0, color: [255, 155, 108] },
      { x: 124, y: -26, size: 5.3, color: [255, 231, 92] },
      { x: 128, y: -8, size: 4.8, color: [181, 126, 255] },
      { x: 132, y: -18, size: 5.5, color: [255, 212, 122] },
      { x: 136, y: 18, size: 4.4, color: [255, 183, 77] },
      { x: 140, y: -42, size: 6.0, color: [132, 204, 255] },
      { x: 144, y: -40, size: 6.5, color: [255, 232, 138] },
      { x: 148, y: -14, size: 4.9, color: [255, 170, 141] },
      { x: 152, y: -2, size: 4.5, color: [210, 170, 255] },
      { x: 156, y: -28, size: 5.6, color: [255, 241, 182] },
      { x: 160, y: 10, size: 4.5, color: [255, 196, 104] },
      { x: 164, y: -34, size: 5.7, color: [120, 190, 255] },
      { x: 168, y: -16, size: 4.8, color: [255, 224, 118] },
      { x: 172, y: 2, size: 4.7, color: [181, 126, 255] },
      { x: 176, y: -22, size: 5.4, color: [255, 246, 188] },
      { x: 180, y: 14, size: 4.5, color: [255, 190, 92] },
      { x: 184, y: -34, size: 6.0, color: [255, 222, 135] },
      { x: 188, y: -6, size: 4.7, color: [132, 204, 255] },
      { x: 192, y: -26, size: 5.1, color: [255, 231, 92] },
      { x: 196, y: -12, size: 5.0, color: [255, 170, 141] },
      { x: 200, y: 6, size: 4.6, color: [181, 126, 255] },
      { x: 204, y: -30, size: 5.7, color: [255, 236, 148] },
      { x: 208, y: -2, size: 4.9, color: [255, 183, 77] },
      { x: 212, y: -18, size: 5.2, color: [120, 190, 255] },
      { x: 216, y: 16, size: 4.4, color: [255, 244, 170] },
      { x: 220, y: -10, size: 4.8, color: [255, 177, 120] },
      { x: 226, y: -24, size: 5.5, color: [210, 170, 255] },
      { x: 232, y: 4, size: 4.7, color: [255, 231, 92] },
      { x: 238, y: -18, size: 5.2, color: [255, 214, 128] },
      { x: 244, y: -2, size: 4.6, color: [132, 204, 255] }
    ];

    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.8 * scale;
    for (const sparkle of sparkles) {
      const sx = sparkle.x * scale + drift;
      const sy = sparkle.y * scale - drift * 0.25;
      const r = sparkle.size * sparkleScale;
      const color = sparkle.color;
      ctx.strokeStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx - r, sy);
      ctx.lineTo(sx + r, sy);
      ctx.moveTo(sx, sy - r);
      ctx.lineTo(sx, sy + r);
      ctx.moveTo(sx - r * 0.68, sy - r * 0.68);
      ctx.lineTo(sx + r * 0.68, sy + r * 0.68);
      ctx.moveTo(sx - r * 0.68, sy + r * 0.68);
      ctx.lineTo(sx + r * 0.68, sy - r * 0.68);
      ctx.stroke();
    }
    ctx.restore();
  }

  function dragonfirev5DrawDragon(ctx, x, y, scale, elapsed, duration) {
    const progress = dragonfirev5Clamp(elapsed / duration, 0, 1);
    const inhaleT = dragonfirev5EaseInOut(dragonfirev5Clamp(progress / 0.18, 0, 1));
    const flameGrowT = dragonfirev5EaseOut(dragonfirev5Clamp((progress - 0.16) / 0.18, 0, 1));
    const flameHoldT = dragonfirev5Clamp((progress - 0.34) / 0.12, 0, 1);
    const flameFadeT = dragonfirev5Clamp((progress - 0.46) / 0.16, 0, 1);
    const sparkleT = dragonfirev5Clamp((progress - 0.52) / 0.24, 0, 1);
    const flyT = dragonfirev5EaseInOut(dragonfirev5Clamp((progress - 0.58) / 0.42, 0, 1));

    const flameSizeT = flameHoldT > 0 ? 1 : flameGrowT;
    const flameAlphaT = flameFadeT > 0 ? (1 - flameFadeT) : (flameSizeT > 0 ? 1 : 0);

    const wingBeat = Math.sin(Math.PI * 6 * flyT);
    const liftX = dragonfirev5Lerp(0, 130 * scale, flyT);
    const departureHeight = Math.max(920 * scale, y + 220 * scale);
    const liftY = dragonfirev5Lerp(0, -departureHeight, flyT);
    const bodyX = x + liftX;
    const bodyY = y + liftY;
    const wingAngle = flyT > 0 ? wingBeat * 0.58 : dragonfirev5Lerp(0.10, -0.04, inhaleT);
    const cheekPuff = inhaleT * (1 - dragonfirev5Clamp((progress - 0.16) / 0.10, 0, 1));

    ctx.save();
    if (flyT < 0.98) {
      ctx.fillStyle = 'rgba(22, 32, 43, 0.14)';
      ctx.beginPath();
      ctx.ellipse(x, y + 6 * scale, 78 * scale, 14 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#3d7a49';
    ctx.lineWidth = 12 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bodyX - 52 * scale, bodyY - 70 * scale);
    ctx.quadraticCurveTo(bodyX - 120 * scale, bodyY - 106 * scale + Math.sin(progress * Math.PI * 2) * 8 * scale, bodyX - 138 * scale, bodyY - 38 * scale);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#6fc96a';
    ctx.strokeStyle = '#3d7a49';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY - 76 * scale, 68 * scale, 54 * scale, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#cfeebf';
    ctx.beginPath();
    ctx.ellipse(bodyX + 10 * scale, bodyY - 62 * scale, 34 * scale, 28 * scale, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6fc96a';
    ctx.save();
    ctx.translate(bodyX + 10 * scale, bodyY - 104 * scale);
    ctx.rotate(wingAngle + 0.08);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(54 * scale, -54 * scale, 92 * scale, -12 * scale);
    ctx.quadraticCurveTo(48 * scale, 0, 0, 18 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(bodyX - 8 * scale, bodyY - 100 * scale);
    ctx.rotate(-wingAngle - 0.14);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-48 * scale, -58 * scale, -94 * scale, -18 * scale);
    ctx.quadraticCurveTo(-52 * scale, 2 * scale, 0, 22 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(bodyX - 8 * scale, bodyY - 122 * scale);
    ctx.lineTo(bodyX + 18 * scale, bodyY - 156 * scale);
    ctx.lineTo(bodyX + 38 * scale, bodyY - 116 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bodyX - 48 * scale, bodyY - 112 * scale);
    ctx.lineTo(bodyX - 74 * scale, bodyY - 150 * scale);
    ctx.lineTo(bodyX - 24 * scale, bodyY - 124 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(bodyX + 46 * scale, bodyY - 126 * scale);
    ctx.rotate(dragonfirev5Lerp(0.10, -0.22, flyT));
    ctx.beginPath();
    ctx.ellipse(0, 0, 38 * scale + cheekPuff * 8 * scale, 34 * scale + cheekPuff * 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(12 * scale, -6 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b3a2b';
    ctx.beginPath();
    ctx.arc(13 * scale, -5 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3d7a49';
    ctx.beginPath();
    ctx.moveTo(24 * scale, -2 * scale);
    ctx.lineTo(36 * scale, 2 * scale);
    ctx.lineTo(24 * scale, 8 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#2b3a2b';
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (flameSizeT > 0.02) {
      ctx.arc(18 * scale, 12 * scale, 10 * scale, 0.02 * Math.PI, 0.98 * Math.PI, false);
    } else if (flyT > 0.40) {
      ctx.arc(16 * scale, 12 * scale, 9 * scale, 0.08 * Math.PI, 0.90 * Math.PI, false);
    } else {
      ctx.arc(16 * scale, 14 * scale, 8 * scale, 0.15 * Math.PI, 0.84 * Math.PI, false);
    }
    ctx.stroke();

    dragonfirev5DrawFlame(ctx, 34 * scale, 10 * scale, scale, flameSizeT, flameAlphaT);
    dragonfirev5DrawSparkles(ctx, 34 * scale, 10 * scale, scale, sparkleT);
    ctx.restore();

    ctx.strokeStyle = '#3d7a49';
    ctx.lineWidth = 10 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bodyX - 26 * scale, bodyY - 40 * scale);
    ctx.lineTo(bodyX - 34 * scale, bodyY + 2 * scale);
    ctx.moveTo(bodyX + 18 * scale, bodyY - 38 * scale);
    ctx.lineTo(bodyX + 26 * scale, bodyY + 4 * scale);
    ctx.stroke();

    ctx.lineWidth = 8 * scale;
    ctx.beginPath();
    ctx.moveTo(bodyX + 30 * scale, bodyY - 82 * scale);
    ctx.quadraticCurveTo(bodyX + 74 * scale, bodyY - 112 * scale, bodyX + 88 * scale, bodyY - 78 * scale);
    ctx.moveTo(bodyX + 6 * scale, bodyY - 84 * scale);
    ctx.quadraticCurveTo(bodyX - 26 * scale, bodyY - 118 * scale, bodyX - 54 * scale, bodyY - 92 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function trainlinkedDrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const duration = pin.rocket.duration;
    const progress = trainlinkedClamp(elapsed / duration, 0, 1);
    const eased = trainlinkedEaseInOut(progress);
    const scale = Math.min(view.w / 1250, view.h / 740) * 0.96;
    const anchorY = pin.y + layout.pinH * 0.58;
    const startX = -10 * scale;
    const endX = view.w + 780 * scale;
    const engineFrontX = trainlinkedLerp(startX, endX, eased);
    trainlinkedDrawAnimation(ctx, engineFrontX, anchorY, scale, elapsed, duration);
  }

  function dragonfirev5DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const duration = pin.rocket.duration;
    const scale = Math.min(view.w / 780, view.h / 660);
    const anchorY = pin.y + layout.pinH * 0.58;
    dragonfirev5DrawDragon(ctx, pin.x, anchorY, scale, elapsed, duration);
  }


  // APPROVED MILLYARD, LIGHT-RAIL, AND RAPTOR DRAWING
  // =====================================================
  function millyardgearv3Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function millyardgearv3Lerp(a, b, t) { return a + (b - a) * t; }

  function millyardgearv3DrawGear(ctx, x, y, radius, teeth, angle, fill, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = fill;
    ctx.strokeStyle = '#34404d';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i += 1) {
      const r = i % 2 === 0 ? radius : radius * 1.18;
      const a = i * Math.PI / teeth;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#f3f7fb';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function millyardgearv3DrawMachine(ctx, x, y, scale, elapsed, duration) {
    const progress = millyardgearv3Clamp(elapsed / duration, 0, 1);
    const spin = progress * Math.PI * 4;
    const boxX = millyardgearv3Lerp(x - 120 * scale, x + 120 * scale, millyardgearv3Clamp((progress - 0.14) / 0.72, 0, 1));

    ctx.save();
    ctx.fillStyle = '#dbe4ee';
    ctx.fillRect(x - 180 * scale, y - 122 * scale, 360 * scale, 218 * scale);
    ctx.strokeStyle = '#7d90a6';
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(x - 180 * scale, y - 122 * scale, 360 * scale, 218 * scale);
    ctx.restore();

    // Top row of gears
    millyardgearv3DrawGear(ctx, x - 103 * scale, y - 48 * scale, 24 * scale, 10, spin, '#e6b25d', scale);
    millyardgearv3DrawGear(ctx, x - 54 * scale, y - 48 * scale, 18 * scale, 8, -spin * 1.1, '#7fb4e7', scale);
    millyardgearv3DrawGear(ctx, x, y - 48 * scale, 28 * scale, 12, spin * 0.8, '#c790d8', scale);
    millyardgearv3DrawGear(ctx, x + 58 * scale, y - 48 * scale, 20 * scale, 8, -spin * 1.05, '#73c58c', scale);
    millyardgearv3DrawGear(ctx, x + 108 * scale, y - 48 * scale, 24 * scale, 10, spin * 0.9, '#ef8f68', scale);
    // Lower accent gear, still clearly away from the block
    millyardgearv3DrawGear(ctx, x + 8 * scale, y - 6 * scale, 16 * scale, 8, -spin * 1.3, '#9dc8f0', scale);

    // Conveyor moved lower to create clear space from all gears
    ctx.save();
    ctx.strokeStyle = '#8e9cad';
    ctx.lineWidth = 12 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 136 * scale, y + 56 * scale);
    ctx.lineTo(x + 136 * scale, y + 56 * scale);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#5ab776';
    ctx.strokeStyle = '#2f7446';
    ctx.lineWidth = 3 * scale;
    ctx.fillRect(boxX - 18 * scale, y + 30 * scale, 36 * scale, 26 * scale);
    ctx.strokeRect(boxX - 18 * scale, y + 30 * scale, 36 * scale, 26 * scale);
    ctx.restore();
  }


  function lightrailv2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function lightrailv2Lerp(a, b, t) { return a + (b - a) * t; }
  function lightrailv2EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function lightrailv2DrawCar(ctx, x, y, scale) {
    ctx.save();
    ctx.fillStyle = '#55a7d8';
    ctx.strokeStyle = '#2e6280';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.roundRect(x - 88 * scale, y - 60 * scale, 176 * scale, 54 * scale, 12 * scale);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#cfeeff';
    for (let i = 0; i < 4; i += 1) ctx.fillRect(x - 68 * scale + i * 34 * scale, y - 48 * scale, 20 * scale, 18 * scale);
    ctx.fillStyle = '#55a7d8';
    ctx.fillRect(x - 10 * scale, y - 60 * scale, 20 * scale, 10 * scale);
    ctx.strokeStyle = '#2e6280';
    ctx.beginPath(); ctx.moveTo(x - 6 * scale, y - 70 * scale); ctx.lineTo(x + 6 * scale, y - 82 * scale); ctx.lineTo(x + 16 * scale, y - 70 * scale); ctx.stroke();
    ctx.fillStyle = '#4e5964';
    ctx.fillRect(x - 72 * scale, y - 8 * scale, 144 * scale, 8 * scale);
    ['-48','48'].forEach(v=>{const ox=parseInt(v); ctx.beginPath(); ctx.arc(x+ox*scale,y+2*scale,10*scale,0,Math.PI*2); ctx.fill(); ctx.stroke();});
    ctx.restore();
  }
  function lightrailv2DrawScene(ctx, x, y, scale, elapsed, duration) {
    const progress = lightrailv2Clamp(elapsed / duration, 0, 1);
    const stageWidth = 1250 * scale;
    const stageLeft = x - stageWidth * 0.5;
    const stageRight = x + stageWidth * 0.5;
    const gx = lightrailv2Lerp(stageLeft - 120 * scale, stageRight + 120 * scale, lightrailv2EaseInOut(lightrailv2Clamp(progress / 0.92, 0, 1)));
    ctx.save(); ctx.strokeStyle='#7a8d9f'; ctx.lineWidth=4*scale; ctx.beginPath();
    ctx.moveTo(stageLeft - 40 * scale, y+14*scale); ctx.lineTo(stageRight + 40 * scale, y+14*scale); ctx.moveTo(stageLeft - 40 * scale, y+36*scale); ctx.lineTo(stageRight + 40 * scale, y+36*scale); ctx.stroke(); ctx.restore();
    for (let i = stageLeft - 60 * scale; i <= stageRight + 60 * scale; i += 36 * scale) { ctx.save(); ctx.strokeStyle='#aab8c6'; ctx.lineWidth=3*scale; ctx.beginPath(); ctx.moveTo(i, y+12*scale); ctx.lineTo(i+14*scale, y+38*scale); ctx.stroke(); ctx.restore(); }
    const bellT = lightrailv2Clamp((progress - 0.52) / 0.16, 0, 1) * (1 - lightrailv2Clamp((progress - 0.72) / 0.10, 0, 1));
    if (bellT > 0) {
      [['#ffd56b',0],['#a98cff',12],['#7cc9ff',24]].forEach(p => { ctx.save(); ctx.strokeStyle=p[0]; ctx.lineWidth=3*scale; ctx.beginPath(); ctx.arc(gx+90*scale+p[1]*0.5*scale, y-58*scale, (10+bellT*16+p[1]*0.1)*scale, 0, Math.PI*2); ctx.stroke(); ctx.restore(); });
    }
    lightrailv2DrawCar(ctx, gx, y, scale);
  }

  function raptorwingv2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function raptorwingv2Lerp(a, b, t) { return a + (b - a) * t; }

  function raptorwingv2DrawBird(ctx, x, y, scale, elapsed, duration) {
    const progress = raptorwingv2Clamp(elapsed / duration, 0, 1);
    const flightT = raptorwingv2Clamp(progress / 0.90, 0, 1);
    const glideX = raptorwingv2Lerp(x - 220 * scale, x + 170 * scale, flightT);
    const arch = Math.sin(flightT * Math.PI);
    const glideY = y - 86 * scale * arch;
    const flap1 = raptorwingv2Clamp((progress - 0.12) / 0.16, 0, 1) * (1 - raptorwingv2Clamp((progress - 0.28) / 0.16, 0, 1));
    const flap2 = raptorwingv2Clamp((progress - 0.34) / 0.16, 0, 1) * (1 - raptorwingv2Clamp((progress - 0.50) / 0.16, 0, 1));
    const flap3 = raptorwingv2Clamp((progress - 0.58) / 0.16, 0, 1) * (1 - raptorwingv2Clamp((progress - 0.74) / 0.16, 0, 1));
    const wingBeat = (flap1 > 0 ? Math.sin(flap1 * Math.PI) : 0) + (flap2 > 0 ? Math.sin(flap2 * Math.PI) : 0) + (flap3 > 0 ? Math.sin(flap3 * Math.PI) : 0);
    const wingAngle = 0.22 - wingBeat * 0.42;
    const landT = raptorwingv2Clamp((progress - 0.78) / 0.22, 0, 1);
    const footY = raptorwingv2Lerp(0, 30 * scale, landT);

    ctx.save();
    ctx.translate(glideX, glideY);
    ctx.fillStyle = '#7c6a57';
    ctx.strokeStyle = '#463b30';
    ctx.lineWidth = 3 * scale;

    ctx.beginPath();
    ctx.ellipse(0, 0, 30 * scale, 18 * scale, -0.1, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.save(); ctx.translate(-6 * scale, -4 * scale); ctx.rotate(-wingAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-52 * scale, -36 * scale, -102 * scale, -14 * scale); ctx.quadraticCurveTo(-64 * scale, 8 * scale, -12 * scale, 12 * scale); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(6 * scale, -4 * scale); ctx.rotate(wingAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(52 * scale, -36 * scale, 102 * scale, -14 * scale); ctx.quadraticCurveTo(64 * scale, 8 * scale, 12 * scale, 12 * scale); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();

    ctx.beginPath(); ctx.arc(26 * scale, -10 * scale, 12 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#e6bf5b'; ctx.beginPath(); ctx.moveTo(36*scale,-10*scale); ctx.lineTo(52*scale,-6*scale); ctx.lineTo(36*scale,-2*scale); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(28*scale,-12*scale,2.2*scale,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#e6bf5b'; ctx.lineCap='round'; ctx.lineWidth=3*scale; ctx.beginPath(); ctx.moveTo(-4*scale, 12*scale); ctx.lineTo(-8*scale, 24*scale+footY); ctx.moveTo(6*scale,12*scale); ctx.lineTo(8*scale,24*scale+footY); ctx.stroke();
    ctx.restore();

    if (landT > 0) { ctx.save(); ctx.fillStyle='rgba(99,138,92,0.35)'; ctx.beginPath(); ctx.ellipse(glideX, y + 46 * scale, 26*scale, 7*scale, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
  }

  function raptorleftv1Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function raptorleftv1Lerp(a, b, t) { return a + (b - a) * t; }
  function raptorleftv1EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function raptorleftv1DrawBird(ctx, x, y, scale, elapsed, duration) {
    const progress = raptorleftv1Clamp(elapsed / duration, 0, 1);

    const takeoffT = raptorleftv1Clamp(progress / 0.22, 0, 1);
    const climbT = raptorleftv1Clamp((progress - 0.14) / 0.86, 0, 1);

    const departureX = Math.max(760 * scale, x + 160 * scale);
    const departureY = Math.max(640 * scale, y + 180 * scale);
    const bodyX = raptorleftv1Lerp(x, x - departureX, raptorleftv1EaseInOut(climbT));
    const bodyY = raptorleftv1Lerp(y, y - departureY, raptorleftv1EaseInOut(climbT));

    const wingCycle = Math.sin(progress * Math.PI * 8);
    const wingAngle = 0.18 + wingCycle * 0.42;
    const footLift = raptorleftv1Lerp(0, -12 * scale, raptorleftv1EaseInOut(takeoffT));
    const bodyTilt = raptorleftv1Lerp(0, -0.35, raptorleftv1EaseInOut(climbT));

    ctx.save();
    if (progress < 0.24) {
      const shadowFade = 1 - raptorleftv1Clamp(progress / 0.24, 0, 1);
      ctx.fillStyle = 'rgba(99,138,92,' + (0.26 * shadowFade).toFixed(3) + ')';
      ctx.beginPath();
      ctx.ellipse(x, y + 46 * scale, 28 * scale, 8 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(bodyX, bodyY);
    ctx.rotate(bodyTilt);
    ctx.scale(-1, 1); // face and fly toward the left

    ctx.fillStyle = '#7c6a57';
    ctx.strokeStyle = '#463b30';
    ctx.lineWidth = 3 * scale;

    ctx.beginPath();
    ctx.ellipse(0, 0, 30 * scale, 18 * scale, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // left wing of local mirrored bird
    ctx.save();
    ctx.translate(-6 * scale, -4 * scale);
    ctx.rotate(-wingAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-52 * scale, -38 * scale, -104 * scale, -14 * scale);
    ctx.quadraticCurveTo(-66 * scale, 8 * scale, -12 * scale, 12 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // right wing
    ctx.save();
    ctx.translate(6 * scale, -4 * scale);
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(52 * scale, -38 * scale, 104 * scale, -14 * scale);
    ctx.quadraticCurveTo(66 * scale, 8 * scale, 12 * scale, 12 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // head
    ctx.beginPath();
    ctx.arc(26 * scale, -10 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // beak
    ctx.fillStyle = '#e6bf5b';
    ctx.beginPath();
    ctx.moveTo(36 * scale, -10 * scale);
    ctx.lineTo(52 * scale, -6 * scale);
    ctx.lineTo(36 * scale, -2 * scale);
    ctx.closePath();
    ctx.fill();

    // eye
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(28 * scale, -12 * scale, 2.2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // legs tucked during lift-off
    ctx.strokeStyle = '#e6bf5b';
    ctx.lineCap = 'round';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(-4 * scale, 12 * scale);
    ctx.lineTo(-8 * scale, 24 * scale + footLift);
    ctx.moveTo(6 * scale, 12 * scale);
    ctx.lineTo(8 * scale, 24 * scale + footLift);
    ctx.stroke();

    ctx.restore();
  }


  function millyardgearv3DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 780, view.h / 660);
    const anchorY = pin.y + layout.pinH * 0.58;
    millyardgearv3DrawMachine(ctx, pin.x, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function lightrailv2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 1250, view.h / 740) * 0.96;
    const anchorY = pin.y + layout.pinH * 0.58;
    lightrailv2DrawScene(ctx, view.w * 0.5, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function raptorwingv2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 780, view.h / 660);
    const anchorY = pin.y + layout.pinH * 0.58;
    raptorwingv2DrawBird(ctx, pin.x, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function raptorleftv1DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 780, view.h / 660);
    const anchorY = pin.y + layout.pinH * 0.58;
    raptorleftv1DrawBird(ctx, pin.x, anchorY, scale, elapsed, pin.rocket.duration);
  }


  // APPROVED REVIEW-BUNDLE ANIMATION DRAWING
  // =====================================================
  function tugboatv1Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function tugboatv1Lerp(a, b, t) { return a + (b - a) * t; }
  function tugboatv1EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function tugboatv1Draw(ctx,x,y,scale,elapsed,duration){
    const p=tugboatv1Clamp(elapsed/duration,0,1); const tx=tugboatv1Lerp(x-120*scale,x+90*scale,tugboatv1EaseInOut(tugboatv1Clamp(p/0.8,0,1))); const bob=Math.sin(p*Math.PI*6)*5*scale;
    ctx.save(); ctx.fillStyle='#9bd5f3'; ctx.beginPath(); ctx.ellipse(x,y+26*scale,170*scale,44*scale,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(tx,y+bob);
    ctx.fillStyle='#d4614f'; ctx.strokeStyle='#6a3a30'; ctx.lineWidth=3*scale;
    ctx.beginPath(); ctx.moveTo(-76*scale,0); ctx.lineTo(62*scale,0); ctx.lineTo(38*scale,30*scale); ctx.lineTo(-52*scale,30*scale); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#f2e8d2'; ctx.fillRect(-12*scale,-44*scale,44*scale,44*scale); ctx.strokeRect(-12*scale,-44*scale,44*scale,44*scale);
    ctx.fillStyle='#87bde5'; ctx.fillRect(-4*scale,-34*scale,14*scale,12*scale); ctx.fillRect(14*scale,-34*scale,14*scale,12*scale);
    ctx.fillStyle='#34404d'; ctx.fillRect(36*scale,-64*scale,10*scale,24*scale); [-42,28].forEach(w=>{ ctx.beginPath(); ctx.arc(w*scale,12*scale,10*scale,0,Math.PI*2); ctx.fill();});
    ctx.restore();
    for(let i=0;i<3;i+=1){ const st=tugboatv1Clamp((p-i*0.09)/0.48,0,1); if(st>0 && st<1){ ctx.save(); ctx.fillStyle='rgba(210,220,230,'+(0.55*(1-st)).toFixed(3)+')'; ctx.beginPath(); ctx.arc(tx+48*scale+st*22*scale,y-56*scale-st*24*scale,(7+st*10)*scale,0,Math.PI*2); ctx.fill(); ctx.restore(); }}
  }

  function jellybeanv3Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function jellybeanv3EaseOut(t) { return 1 - Math.pow(1 - t, 3); }
  function jellybeanv3DrawStar(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function jellybeanv3DrawHouse(ctx,x,y,scale,color,roof,t){
    if(t<=0)return;
    ctx.save();
    ctx.translate(x,y+(1-t)*30*scale);
    ctx.globalAlpha=t;
    ctx.fillStyle=color;
    ctx.strokeStyle='#44525e';
    ctx.lineWidth=3*scale;
    ctx.fillRect(-26*scale,-44*scale,52*scale,50*scale);
    ctx.strokeRect(-26*scale,-44*scale,52*scale,50*scale);
    ctx.beginPath();
    ctx.moveTo(-32*scale,-44*scale);
    ctx.lineTo(0,-72*scale);
    ctx.lineTo(32*scale,-44*scale);
    ctx.closePath();
    ctx.fillStyle=roof;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle='#dce9f4';
    ctx.fillRect(-10*scale,-20*scale,20*scale,16*scale);
    ctx.fillRect(-6*scale,-2*scale,12*scale,8*scale);
    ctx.restore();
  }

  function jellybeanv3Draw(ctx,x,y,scale,elapsed,duration){
    const p=jellybeanv3Clamp(elapsed/duration,0,1);
    const cols=[
      ['#ef5350','#d84343'],
      ['#ff9800','#f57c00'],
      ['#f6d64a','#e5b93b'],
      ['#66bb6a','#4c9f50'],
      ['#42a5f5','#2d82c7'],
      ['#8e66d9','#7049bc']
    ];
    [-160,-96,-32,32,96,160].forEach((dx,i)=>{{
      jellybeanv3DrawHouse(ctx,x+dx*scale,y,scale,cols[i][0],cols[i][1], jellybeanv3EaseOut(jellybeanv3Clamp((p-0.07*i)/0.24,0,1)));
    }});
    const st=jellybeanv3Clamp((p-0.56)/0.24,0,1);
    if(st>0){{
      [[-174,-98],[-110,-122],[-42,-112],[36,-124],[110,-112],[178,-92]].forEach((s,i)=>{{
        jellybeanv3DrawStar(ctx,x+s[0]*scale,y+s[1]*scale,(5 + (i%3))*scale,'rgba(255,255,255,'+(1-st).toFixed(3)+')');
      }});
    }}
  }

  function tulipsv3Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function tulipsv3EaseOut(t) { return 1 - Math.pow(1 - t, 3); }
  function tulipsv3DrawStar(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function tulipsv3DrawTulip(ctx,x,y,scale,t,color){
    if(t<=0)return;
    ctx.save();ctx.translate(x,y);ctx.strokeStyle='#4e9e55';ctx.lineWidth=4*scale;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,28*scale);ctx.lineTo(0,-16*scale*t);ctx.stroke();
    ctx.fillStyle='#73c96b';ctx.beginPath();ctx.ellipse(-8*scale,8*scale,10*scale*t,5*scale*t,-0.6,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(8*scale,0,10*scale*t,5*scale*t,0.6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-16*scale*t,-16*scale*t);ctx.quadraticCurveTo(-10*scale*t,-42*scale*t,0,-28*scale*t);ctx.quadraticCurveTo(10*scale*t,-42*scale*t,16*scale*t,-16*scale*t);ctx.quadraticCurveTo(0,-6*scale*t,-16*scale*t,-16*scale*t);ctx.fill();ctx.restore();
  }
  function tulipsv3Draw(ctx,x,y,scale,elapsed,duration){
    const p=tulipsv3Clamp(elapsed/duration,0,1);
    const colors=['#ff6f91','#ffd166','#7cc9ff','#caa7ff','#ff9f6e','#ef476f','#95d66b','#ffa1c8','#8ad3ff','#ffd98a','#b29cff'];
    for(let i=0;i<11;i+=1){
      const t=tulipsv3EaseOut(tulipsv3Clamp((p-0.055*i)/0.22,0,1));
      tulipsv3DrawTulip(ctx,x+(-200+i*40)*scale,y+Math.sin(i*0.7)*7*scale,scale,t,colors[i]);
    }
    const wave=tulipsv3Clamp((p-0.68)/0.24,0,1);
    if(wave>0){for(let i=0;i<11;i+=1){tulipsv3DrawStar(ctx,x+(-200+i*40)*scale,y-64*scale+Math.sin(i+wave*5)*10*scale,5*scale,'rgba(255,232,130,'+(1-wave).toFixed(3)+')');}}
  }

  function ribbondancev3Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function ribbondancev3Draw(ctx,x,y,scale,elapsed,duration){
    const p=ribbondancev3Clamp(elapsed/duration,0,1);
    const colors=['#e95757','#f39b43','#f3d85e','#56b96c','#55a7d8','#8e6ad8'];
    colors.forEach((c,i)=>{
      ctx.save(); ctx.strokeStyle=c; ctx.lineWidth=6*scale; ctx.lineCap='round';
      ctx.beginPath();
      const phase=p*Math.PI*2+i*0.5;
      ctx.moveTo(x-120*scale,y+Math.sin(phase)*22*scale);
      ctx.bezierCurveTo(x-55*scale,y-70*scale*Math.sin(p*Math.PI)+i*3*scale,x+55*scale,y+70*scale*Math.sin(p*Math.PI)+i*2*scale,x+120*scale,y+Math.cos(phase)*22*scale);
      ctx.stroke(); ctx.restore();
    });
    const bowT=ribbondancev3Clamp((p-0.68)/0.25,0,1);
    if(bowT>0){
      ctx.save(); ctx.translate(x,y); ctx.globalAlpha=bowT;
      ctx.fillStyle='rgba(255,143,177,0.9)';
      ctx.beginPath(); ctx.ellipse(-20*scale,0,24*scale*bowT,14*scale*bowT,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(20*scale,0,24*scale*bowT,14*scale*bowT,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff6a8'; ctx.beginPath(); ctx.arc(0,0,8*scale*bowT,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  function metrotrainv2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function metrotrainv2Lerp(a, b, t) { return a + (b - a) * t; }
  function metrotrainv2EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function metrotrainv2Draw(ctx,x,y,scale,elapsed,duration){
    const p=metrotrainv2Clamp(elapsed/duration,0,1);
    const stageWidth=820*scale;
    const stageLeft=x-stageWidth*0.5;
    const stageRight=x+stageWidth*0.5;
    const tx=metrotrainv2Lerp(stageLeft-180*scale,stageRight+180*scale,metrotrainv2EaseInOut(metrotrainv2Clamp(p/0.92,0,1)));
    ctx.save();ctx.strokeStyle='#7a8d9f';ctx.lineWidth=5*scale;ctx.beginPath();ctx.moveTo(stageLeft-40*scale,y+22*scale);ctx.lineTo(stageRight+40*scale,y+22*scale);ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(tx,y);ctx.fillStyle='#4b8bd8';ctx.strokeStyle='#2d517e';ctx.lineWidth=3*scale;ctx.beginPath();ctx.roundRect(-95*scale,-58*scale,190*scale,60*scale,14*scale);ctx.fill();ctx.stroke();
    ctx.fillStyle='#cfeeff';for(let i=0;i<4;i+=1){ctx.fillRect((-70+i*36)*scale,-46*scale,22*scale,18*scale);} 
    const doorT=metrotrainv2Clamp((p-0.28)/0.12,0,1)*(1-metrotrainv2Clamp((p-0.44)/0.12,0,1));
    ctx.fillStyle='#dfe9f4';ctx.fillRect(-8*scale-doorT*12*scale,-36*scale,14*scale,36*scale);ctx.fillRect(8*scale+doorT*12*scale,-36*scale,14*scale,36*scale);
    ctx.fillStyle='#26384a';[-60,60].forEach(w=>{ctx.beginPath();ctx.arc(w*scale,6*scale,9*scale,0,Math.PI*2);ctx.fill();});ctx.restore();
  }

  function tugboatv1DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 800, view.h / 560);
    const marginX = 180 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    tugboatv1Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function jellybeanv3DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const intendedScale = Math.min(view.w / 760, view.h / 560) * 2;
    const scale = Math.min(intendedScale, (view.w - 16) / 396);
    const marginX = 198 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    jellybeanv3Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function tulipsv3DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 1880, view.h / 1080) * 4;
    const marginX = 216 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    tulipsv3Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function ribbondancev3DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 1560, view.h / 1080) * 4;
    const marginX = 126 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    ribbondancev3Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function metrotrainv2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = view.w / 820;
    const anchorY = pin.y + layout.pinH * 0.58;
    metrotrainv2Draw(ctx, view.w * 0.5, anchorY, scale, elapsed, pin.rocket.duration);
  }


  // APPROVED CARDINAL, HANBOK, AND MERSEY FERRY DRAWING
  // =====================================================
  function cardinalflyoffv1Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function cardinalflyoffv1Lerp(a, b, t) { return a + (b - a) * t; }
  function cardinalflyoffv1EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function cardinalflyoffv1DrawStar(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function cardinalflyoffv1Draw(ctx,x,y,scale,elapsed,duration){
    const p=cardinalflyoffv1Clamp(elapsed/duration,0,1);
    const fly=cardinalflyoffv1Clamp(p/0.92,0,1);
    const stageWidth = 390*scale;
    const startX = x-stageWidth*0.5-180*scale;
    const endX = x+stageWidth*0.5+140*scale;
    const cx=cardinalflyoffv1Lerp(startX,endX,cardinalflyoffv1EaseInOut(fly));
    const cy=cardinalflyoffv1Lerp(y-126*scale,y-170*scale,fly)-Math.sin(fly*Math.PI)*30*scale;
    const wing=Math.sin(Math.min(1,p/0.9)*Math.PI*9)*0.45;
    ctx.save(); ctx.translate(cx,cy); ctx.fillStyle='#d94b4b'; ctx.beginPath(); ctx.ellipse(0,0,28*scale,18*scale,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(22*scale,-12*scale,12*scale,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(32*scale,-14*scale); ctx.lineTo(48*scale,-10*scale); ctx.lineTo(32*scale,-4*scale); ctx.closePath(); ctx.fillStyle='#ffb15c'; ctx.fill(); ctx.save(); ctx.rotate(-0.4+wing); ctx.fillStyle='#bc3434'; ctx.beginPath(); ctx.ellipse(-8*scale,-8*scale,12*scale,26*scale,0,0,Math.PI*2); ctx.fill(); ctx.restore(); ctx.save(); ctx.rotate(0.4-wing); ctx.fillStyle='#bc3434'; ctx.beginPath(); ctx.ellipse(-2*scale,10*scale,12*scale,24*scale,0,0,Math.PI*2); ctx.fill(); ctx.restore(); ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(26*scale,-14*scale,2*scale,0,Math.PI*2); ctx.fill(); ctx.restore();
    const spark=cardinalflyoffv1Clamp((p-0.76)/0.14,0,1);
    if(spark>0 && spark<1){ cardinalflyoffv1DrawStar(ctx,cx-42*scale,cy-38*scale,8*scale,'rgba(255,214,106,'+(1-spark).toFixed(3)+')'); }
  }

  function hanbokv2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function hanbokv2Draw(ctx,x,y,scale,elapsed,duration){
    const p=hanbokv2Clamp(elapsed/duration,0,1); const colors=['#ff8db3','#ffd36a','#78c8ff','#95de85','#c2a0ff'];
    colors.forEach((c,i)=>{ const t=hanbokv2Clamp((p-i*0.04)/0.55,0,1); ctx.save(); ctx.strokeStyle=c; ctx.lineWidth=8*scale; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y); ctx.bezierCurveTo(x-60*scale,y-80*scale*t+i*6*scale,x+50*scale,y+80*scale*t-i*5*scale,x+Math.cos(i*1.2)*110*scale*t,y+Math.sin(i*1.2)*110*scale*t); ctx.stroke(); ctx.restore(); });
    const petal=hanbokv2Clamp((p-0.58)/0.24,0,1); if(petal>0){ for(let i=0;i<6;i+=1){ const a=i*Math.PI/3; ctx.save(); ctx.translate(x,y); ctx.rotate(a); ctx.fillStyle=['#ffb1c7','#ffd68a','#b8e57a','#8fd2ff','#d2b6ff','#ffb989'][i]; ctx.beginPath(); ctx.ellipse(0,-38*scale*petal,12*scale*petal,24*scale*petal,0,0,Math.PI*2); ctx.fill(); ctx.restore(); } }
  }

  function merseyferryv1Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function merseyferryv1Lerp(a, b, t) { return a + (b - a) * t; }
  function merseyferryv1EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function merseyferryv1Draw(ctx,x,y,scale,elapsed,duration){
    const p=merseyferryv1Clamp(elapsed/duration,0,1); const stageWidth=920*scale; const stageLeft=x-stageWidth*0.5; const stageRight=x+stageWidth*0.5; const fx=merseyferryv1Lerp(stageLeft-160*scale,stageRight+180*scale,merseyferryv1EaseInOut(merseyferryv1Clamp(p/0.92,0,1)));
    ctx.save(); ctx.fillStyle='#9fd6f7'; ctx.fillRect(stageLeft,y-6*scale,stageWidth,76*scale); ctx.restore();
    [0,1,2].forEach(i=>{ ctx.save(); ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=4*scale; ctx.beginPath(); const yy=y+10*scale+i*20*scale; ctx.moveTo(stageLeft,yy); ctx.quadraticCurveTo(stageLeft+stageWidth*0.33,yy+6*scale*Math.sin(p*5+i),stageLeft+stageWidth*0.66,yy); ctx.quadraticCurveTo(stageLeft+stageWidth*0.85,yy-6*scale*Math.sin(p*5+i),stageRight,yy); ctx.stroke(); ctx.restore(); });
    ctx.save(); ctx.translate(fx,y); ctx.fillStyle='#ffffff'; ctx.strokeStyle='#4b5f74'; ctx.lineWidth=3*scale; ctx.beginPath(); ctx.moveTo(-90*scale,10*scale); ctx.lineTo(70*scale,10*scale); ctx.lineTo(88*scale,-10*scale); ctx.lineTo(-72*scale,-10*scale); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle='#6faedc'; ctx.fillRect(-28*scale,-42*scale,68*scale,28*scale); ctx.fillStyle='#dff4ff'; [-16,8].forEach(dx=>ctx.fillRect(dx*scale,-34*scale,12*scale,10*scale)); ctx.fillStyle='#2d3d4a'; ctx.fillRect(46*scale,-38*scale,6*scale,16*scale); ctx.restore();
  }

  function cardinalflyoffv1DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = view.w / 390;
    const TOP_SAFE_MARGIN = 8;
    const launchTopExtent = 174 * scale;
    const baseAnchorY = pin.y + layout.pinH * 0.58;
    const safeYOffset = Math.max(0, TOP_SAFE_MARGIN - (baseAnchorY - launchTopExtent));
    const anchorY = baseAnchorY + safeYOffset;
    cardinalflyoffv1Draw(ctx, view.w * 0.5, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function hanbokv2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 760, view.h / 560) * 2;
    const marginX = 118 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    hanbokv2Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function merseyferryv1DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = view.w / 920;
    const anchorY = pin.y + layout.pinH * 0.58;
    merseyferryv1Draw(ctx, view.w * 0.5, anchorY, scale, elapsed, pin.rocket.duration);
  }


  // APPROVED V1.5.8 BUNDLE ANIMATION DRAWING
  // =====================================================
  function cardinalv3Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function cardinalv3Lerp(a, b, t) { return a + (b - a) * t; }
  function cardinalv3EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function cardinalv3DrawStar(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function cardinalv3Draw(ctx, x, y, scale, elapsed, duration) {
    const p = cardinalv3Clamp(elapsed / duration, 0, 1);
    const fly = cardinalv3Clamp(p / 0.82, 0, 1);
    const startX = x - 336 * scale;
    const endX = x - 16 * scale;
    const cx = cardinalv3Lerp(startX, endX, cardinalv3EaseInOut(fly));
    const cy = cardinalv3Lerp(y - 130 * scale, y - 12 * scale, fly) - Math.sin(fly * Math.PI) * 26 * scale;
    const wing = Math.sin(Math.min(1, p / 0.8) * Math.PI * 8) * 0.45;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#d94b4b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 28 * scale, 18 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(22 * scale, -12 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(32 * scale, -14 * scale);
    ctx.lineTo(48 * scale, -10 * scale);
    ctx.lineTo(32 * scale, -4 * scale);
    ctx.closePath();
    ctx.fillStyle = '#ffb15c';
    ctx.fill();
    ctx.save();
    ctx.rotate(-0.4 + wing);
    ctx.fillStyle = '#bc3434';
    ctx.beginPath();
    ctx.ellipse(-8 * scale, -8 * scale, 12 * scale, 26 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(0.4 - wing);
    ctx.fillStyle = '#bc3434';
    ctx.beginPath();
    ctx.ellipse(-2 * scale, 10 * scale, 12 * scale, 24 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(26 * scale, -14 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (p > 0.82) {
      cardinalv3DrawStar(ctx, x + 150 * scale, y - 56 * scale, 8 * scale, '#ffd36a');
    }
  }

  function tropicalbirdv2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function tropicalbirdv2Lerp(a, b, t) { return a + (b - a) * t; }
  function tropicalbirdv2EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function tropicalbirdv2Draw(ctx, x, y, scale, elapsed, duration) {
    const p = tropicalbirdv2Clamp(elapsed / duration, 0, 1);
    ctx.save();
    ctx.fillStyle = '#86c873';
    ctx.fillRect(x - 150 * scale, y + 18 * scale, 300 * scale, 44 * scale);
    ctx.restore();

    let bx = x - 86 * scale;
    let by = y - 8 * scale;
    let wing = 0;

    if (p < 0.58) {
      const hopP = tropicalbirdv2Clamp(p / 0.58, 0, 1);
      bx = tropicalbirdv2Lerp(x - 86 * scale, x + 34 * scale, tropicalbirdv2EaseInOut(hopP));
      by = y - 8 * scale - Math.abs(Math.sin(hopP * Math.PI * 2)) * 28 * scale;
      wing = Math.sin(hopP * Math.PI * 4) * 0.30;
    } else {
      const flyP = tropicalbirdv2EaseInOut(tropicalbirdv2Clamp((p - 0.58) / 0.34, 0, 1));
      bx = tropicalbirdv2Lerp(x + 34 * scale, x + 500 * scale, flyP);
      by = tropicalbirdv2Lerp(y - 8 * scale, y - 180 * scale, flyP) - Math.sin(flyP * Math.PI) * 24 * scale;
      wing = Math.sin(tropicalbirdv2Clamp((p - 0.58) / 0.34, 0, 1) * Math.PI * 8) * 0.55;
    }

    ctx.save();
    ctx.translate(bx, by);
    ctx.fillStyle = '#f7b267';
    ctx.beginPath();
    ctx.ellipse(0, -22 * scale, 28 * scale, 20 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2fa36b';
    ctx.beginPath();
    ctx.arc(22 * scale, -42 * scale, 13 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f25f5c';
    ctx.beginPath();
    ctx.moveTo(35 * scale, -42 * scale);
    ctx.lineTo(54 * scale, -36 * scale);
    ctx.lineTo(35 * scale, -30 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.rotate(wing);
    ctx.fillStyle = '#5bc0eb';
    ctx.beginPath();
    ctx.ellipse(-10 * scale, -24 * scale, 22 * scale, 11 * scale, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#7a5532';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(-6 * scale, -4 * scale);
    ctx.lineTo(-8 * scale, 18 * scale);
    ctx.moveTo(8 * scale, -4 * scale);
    ctx.lineTo(10 * scale, 18 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function rainbowbridgepopv2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function rainbowbridgepopv2EaseOut(t) { return 1 - Math.pow(1 - t, 3); }
  function rainbowbridgepopv2DrawCloud(ctx, x, y, scale, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x - 20 * scale, y, 16 * scale, 0, Math.PI * 2);
    ctx.arc(x, y - 9 * scale, 23 * scale, 0, Math.PI * 2);
    ctx.arc(x + 24 * scale, y, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function rainbowbridgepopv2DrawRainbowArc(ctx, x, y, scale, progress, alpha) {
    const colors = ['#f25f5c','#f7b267','#ffe066','#7bd389','#5bc0eb','#758bfd','#c77dff'];
    ctx.save();
    ctx.globalAlpha = alpha;
    colors.forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 10 * scale;
      ctx.beginPath();
      ctx.arc(x, y, (78 - i * 8) * scale, Math.PI, Math.PI + Math.PI * progress, false);
      ctx.stroke();
    });
    ctx.restore();
  }
  function rainbowbridgepopv2Draw(ctx, x, y, scale, elapsed, duration) {
    const p = rainbowbridgepopv2Clamp(elapsed / duration, 0, 1);
    const cloudScale = 1 + 0.08 * Math.sin(Math.min(p, 0.35) / 0.35 * Math.PI);
    rainbowbridgepopv2DrawCloud(ctx, x - 112 * scale, y - 8 * scale, cloudScale * scale, '#ffffff');
    rainbowbridgepopv2DrawCloud(ctx, x + 112 * scale, y - 8 * scale, cloudScale * scale, '#ffffff');
    const arcP = rainbowbridgepopv2EaseOut(rainbowbridgepopv2Clamp((p - 0.16) / 0.38, 0, 1));
    rainbowbridgepopv2DrawRainbowArc(ctx, x, y + 10 * scale, scale, arcP, 1);
  }

  function mosaictileshimmerv2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function mosaictileshimmerv2EaseOut(t) { return 1 - Math.pow(1 - t, 3); }
  function mosaictileshimmerv2DrawStar(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function mosaictileshimmerv2Draw(ctx, x, y, scale, elapsed, duration) {
    const p = mosaictileshimmerv2Clamp(elapsed / duration, 0, 1);
    const colors = ['#ffd36a','#5bc0eb','#c77dff','#7bd389','#f25f5c','#f7b267'];
    const size = 24 * scale;
    const rows = 6;
    const cols = 7;
    const rowOffsets = [-2.5,-1.5,-0.5,0.5,1.5,2.5];
    const colOffsets = [-3,-2,-1,0,1,2,3];
    let k = 0;
    for (let ri = 0; ri < rows; ri += 1) {
      for (let ci = 0; ci < cols; ci += 1) {
        const t = mosaictileshimmerv2EaseOut(mosaictileshimmerv2Clamp((p - k * 0.015) / 0.18, 0, 1));
        if (t > 0) {
          const r = rowOffsets[ri];
          const c = colOffsets[ci];
          ctx.save();
          ctx.globalAlpha = t;
          ctx.translate(x + c * size, y - 46 * scale + r * size);
          ctx.rotate((c + r) * 0.08 * t);
          ctx.fillStyle = colors[(k + 2) % colors.length];
          ctx.fillRect(-size / 2, -size / 2, size * 0.88, size * 0.88);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 * scale;
          ctx.strokeRect(-size / 2, -size / 2, size * 0.88, size * 0.88);
          ctx.restore();
        }
        k += 1;
      }
    }
    if (p > 0.72) {
      mosaictileshimmerv2DrawStar(ctx, x, y - 48 * scale, 10 * scale, '#fff6b0');
      mosaictileshimmerv2DrawStar(ctx, x + 96 * scale, y - 104 * scale, 6 * scale, '#ffffff');
    }
  }

  function columncircledancev2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function columncircledancev2EaseOut(t) { return 1 - Math.pow(1 - t, 3); }
  function columncircledancev2DrawStar(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function columncircledancev2Draw(ctx, x, y, scale, elapsed, duration) {
    const p = columncircledancev2Clamp(elapsed / duration, 0, 1);
    const columns = [
      { dx: -180, dy: 18, fill: '#b9e7ff', stroke: '#7bb4d8' },
      { dx: -90,  dy: -10, fill: '#f8b7d5', stroke: '#d58aad' },
      { dx: 0,    dy: -24, fill: '#ffffff', stroke: '#c8c8c8' },
      { dx: 90,   dy: -10, fill: '#f8b7d5', stroke: '#d58aad' },
      { dx: 180,  dy: 18, fill: '#b9e7ff', stroke: '#7bb4d8' },
    ];
    const colW = 40 * scale;
    const colH = 128 * scale;
    const capW = 64 * scale;
    const capH = 16 * scale;

    columns.forEach((col, i) => {
      const t = columncircledancev2EaseOut(columncircledancev2Clamp((p - i * 0.065) / 0.24, 0, 1));
      if (t > 0) {
        const cx = x + col.dx * scale;
        const cy = y + col.dy * scale;
        ctx.save();
        ctx.globalAlpha = t;
        ctx.fillStyle = col.fill;
        ctx.strokeStyle = col.stroke;
        ctx.lineWidth = 3 * scale;
        ctx.fillRect(cx - colW / 2, cy - colH * t, colW, colH * t);
        ctx.strokeRect(cx - colW / 2, cy - colH * t, colW, colH * t);
        ctx.fillRect(cx - capW / 2, cy - colH * t - capH, capW, capH);
        ctx.strokeRect(cx - capW / 2, cy - colH * t - capH, capW, capH);
        ctx.fillRect(cx - capW / 2, cy, capW, capH);
        ctx.strokeRect(cx - capW / 2, cy, capW, capH);
        ctx.restore();
      }
    });
    if (p > 0.72) {
      columncircledancev2DrawStar(ctx, x, y - 172 * scale, 9 * scale, '#ffd36a');
    }
  }

  function campwagonv2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function campwagonv2Lerp(a, b, t) { return a + (b - a) * t; }
  function campwagonv2EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function campwagonv2DrawStar(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function campwagonv2Draw(ctx, x, y, scale, elapsed, duration) {
    const p = campwagonv2Clamp(elapsed / duration, 0, 1);
    const move = campwagonv2EaseInOut(campwagonv2Clamp(p / 0.88, 0, 1));
    const stageWidth = 900 * scale;
    const stageLeft = x - stageWidth * 0.5;
    const stageRight = x + stageWidth * 0.5;
    const wx = campwagonv2Lerp(stageLeft - 140 * scale, stageRight + 160 * scale, move);
    const bob = Math.sin(p * Math.PI * 8) * 4 * scale;
    ctx.save(); ctx.translate(wx, y + bob);
    ctx.fillStyle = '#d85c47'; ctx.strokeStyle = '#7f3e32'; ctx.lineWidth = 3 * scale;
    ctx.fillRect(-70 * scale, -36 * scale, 110 * scale, 30 * scale); ctx.strokeRect(-70 * scale, -36 * scale, 110 * scale, 30 * scale);
    ctx.strokeStyle = '#8b633c'; ctx.lineWidth = 5 * scale; ctx.beginPath(); ctx.moveTo(40 * scale, -16 * scale); ctx.lineTo(88 * scale, -28 * scale); ctx.stroke();
    ctx.fillStyle = '#2d3d4a'; [-44, 12].forEach(dx=>{ ctx.beginPath(); ctx.arc(dx * scale, 4 * scale, 12 * scale, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    if (p > 0.46 && p < 0.68) campwagonv2DrawStar(ctx, wx + 12 * scale, y - 54 * scale, 8 * scale, '#ffd36a');
  }

  function flowerwavev2Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function flowerwavev2EaseOut(t) { return 1 - Math.pow(1 - t, 3); }
  function flowerwavev2Draw(ctx, x, y, scale, elapsed, duration) {
    const p = flowerwavev2Clamp(elapsed / duration, 0, 1);
    const bloomScale = 1.4;
    const flowers = [
      [-150, '#ef5350'],
      [-90, '#ff9800'],
      [-30, '#f6d64a'],
      [30, '#66bb6a'],
      [90, '#42a5f5'],
      [150, '#8e66d9']
    ];
    flowers.forEach((flower, i) => {
      const t = flowerwavev2EaseOut(flowerwavev2Clamp((p - i * 0.07) / 0.28, 0, 1));
      if (t > 0) {
        ctx.save();
        ctx.strokeStyle = '#6f9850';
        ctx.lineWidth = 4 * scale * bloomScale;
        ctx.beginPath();
        ctx.moveTo(x + flower[0] * scale, y + 8 * scale);
        ctx.lineTo(x + flower[0] * scale, y - 58 * scale * t);
        ctx.stroke();
        ctx.translate(x + flower[0] * scale, y - 70 * scale * t);
        ctx.fillStyle = flower[1];
        for (let j = 0; j < 6; j += 1) {
          ctx.save();
          ctx.rotate(j * Math.PI / 3);
          ctx.beginPath();
          ctx.ellipse(0, -14 * scale * bloomScale / 1.4, 11.2 * scale, 22.4 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#ffd992';
        ctx.beginPath();
        ctx.arc(0, 0, 7 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  function garbagebinliftv11Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function garbagebinliftv11Lerp(a, b, t) { return a + (b - a) * t; }
  function garbagebinliftv11EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function garbagebinliftv11EaseOut(t) { return 1 - Math.pow(1 - t, 3); }
  function garbagebinliftv11RoundRectPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }
  function garbagebinliftv11RotatePoint(px, py, angle) {
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    return { x: px * ca - py * sa, y: px * sa + py * ca };
  }
  function garbagebinliftv11DrawGround(context, x, y, scale) {
    context.save();
    context.strokeStyle = '#c2cfdb';
    context.lineWidth = 4 * scale;
    context.beginPath();
    context.moveTo(x - 230 * scale, y + 4 * scale);
    context.lineTo(x + 220 * scale, y + 4 * scale);
    context.stroke();
    context.restore();
  }
  function garbagebinliftv11DrawTruck(context, x, y, scale) {
    context.save();
    context.translate(x, y);
    context.fillStyle = '#5aa15d';
    garbagebinliftv11RoundRectPath(context, -116 * scale, -72 * scale, 162 * scale, 60 * scale, 10 * scale);
    context.fill();
    context.fillStyle = '#3d7d43';
    context.fillRect(-116 * scale, -72 * scale, 12 * scale, 60 * scale);
    context.fillStyle = '#79b8e8';
    garbagebinliftv11RoundRectPath(context, 48 * scale, -61 * scale, 54 * scale, 46 * scale, 8 * scale);
    context.fill();
    context.fillStyle = '#d9eefb';
    context.fillRect(60 * scale, -53 * scale, 26 * scale, 18 * scale);
    context.fillStyle = '#3b4955';
    context.fillRect(-88 * scale, -62 * scale, 18 * scale, 20 * scale);
    context.fillStyle = '#2a333b';
    [-72, 68].forEach(wx => {
      context.beginPath();
      context.arc(wx * scale, -10 * scale, 15 * scale, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#c5cfd7';
      context.beginPath();
      context.arc(wx * scale, -10 * scale, 6 * scale, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#2a333b';
    });
    context.restore();
  }
  function garbagebinliftv11DrawBin(context, x, y, scale, rotation) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillStyle = '#4c8fd8';
    garbagebinliftv11RoundRectPath(context, -20 * scale, -42 * scale, 40 * scale, 50 * scale, 7 * scale);
    context.fill();
    context.fillStyle = '#2f6ead';
    context.fillRect(-24 * scale, -48 * scale, 48 * scale, 8 * scale);
    context.restore();
  }
  function garbagebinliftv11DrawBag(context, x, y, scale) {
    context.save();
    context.translate(x, y);
    context.fillStyle = '#204d2b';
    context.beginPath();
    context.moveTo(-2.4 * scale, 3.2 * scale);
    context.quadraticCurveTo(-3.6 * scale, 0, -2.2 * scale, -3.6 * scale);
    context.quadraticCurveTo(-2.0 * scale, -5.4 * scale, -0.8 * scale, -6.8 * scale);
    context.quadraticCurveTo(-0.4 * scale, -8.0 * scale, 0, -9.2 * scale);
    context.quadraticCurveTo(0.4 * scale, -8.0 * scale, 0.8 * scale, -6.8 * scale);
    context.quadraticCurveTo(2.0 * scale, -5.4 * scale, 2.2 * scale, -3.6 * scale);
    context.quadraticCurveTo(3.6 * scale, 0, 2.4 * scale, 3.2 * scale);
    context.quadraticCurveTo(0, 4.4 * scale, -2.4 * scale, 3.2 * scale);
    context.closePath();
    context.fill();
    context.fillStyle = '#2d6938';
    context.beginPath();
    context.moveTo(-0.8 * scale, -6.8 * scale);
    context.lineTo(0, -9.2 * scale);
    context.lineTo(0.8 * scale, -6.8 * scale);
    context.lineTo(0, -5.8 * scale);
    context.closePath();
    context.fill();
    context.restore();
  }
  function garbagebinliftv11DrawBags(context, truckY, binInfo, progress) {
    const overall = garbagebinliftv11Clamp((progress - 0.50) / 0.22, 0, 1);
    if (overall <= 0) return;
    const scale = binInfo.scale;
    const truckTopY = truckY - 72 * scale;
    const bags = [
      { delay: 0.00, localX: -22 * scale },
      { delay: 0.05, localX: -20 * scale },
      { delay: 0.10, localX: -18 * scale },
      { delay: 0.15, localX: -16 * scale },
      { delay: 0.20, localX: -14 * scale }
    ];
    for (const bag of bags) {
      const bagT = garbagebinliftv11Clamp((overall - bag.delay) / (0.74 - bag.delay), 0, 1);
      if (bagT <= 0) continue;
      const source = garbagebinliftv11RotatePoint(bag.localX, -44 * scale, binInfo.rotation);
      const startX = binInfo.x + source.x;
      const startY = binInfo.y + source.y;
      const endX = startX + garbagebinliftv11Lerp(-2 * scale, 10 * scale, bagT);
      const endY = startY + 66 * scale * garbagebinliftv11EaseOut(bagT);
      const bx = garbagebinliftv11Lerp(startX, endX, bagT);
      if (endY >= truckTopY) continue;
      context.save();
      context.translate(bx, endY);
      context.rotate(binInfo.rotation * 0.2 + Math.sin(bagT * Math.PI * 2) * (1 - bagT) * 0.16);
      garbagebinliftv11DrawBag(context, 0, 0, scale);
      context.restore();
    }
  }
  function garbagebinliftv11Draw(context, x, y, scale, elapsed, duration, stageWidth) {
    const safeElapsed = garbagebinliftv11Clamp(elapsed, 0, duration);
    const sequenceProgress = garbagebinliftv11Clamp(safeElapsed / 5800, 0, 1);
    const departStartMs = 5104;
    const departDurationMs = 1450;
    garbagebinliftv11DrawGround(context, x, y, scale);

    const binBaseX = x + 98 * scale;
    const binBaseY = y - 3 * scale;
    const liftedX = x + 30 * scale;
    const liftedY = y - 94 * scale;
    const liftedRotation = -1.28;

    let truckX;
    if (safeElapsed < departStartMs) {
      const driveInT = garbagebinliftv11Clamp(sequenceProgress / 0.24, 0, 1);
      truckX = garbagebinliftv11Lerp(x - 130 * scale, x, garbagebinliftv11EaseOut(driveInT));
    } else {
      const driveOutT = garbagebinliftv11EaseInOut(garbagebinliftv11Clamp((safeElapsed - departStartMs) / departDurationMs, 0, 1));
      truckX = garbagebinliftv11Lerp(x, x + stageWidth * 0.70, driveOutT);
    }
    garbagebinliftv11DrawTruck(context, truckX, y, scale);

    const upPhase = garbagebinliftv11Clamp((sequenceProgress - 0.26) / 0.22, 0, 1);
    const downPhase = garbagebinliftv11Clamp((sequenceProgress - 0.70) / 0.18, 0, 1);
    let binX;
    let binY;
    let rotation;
    if (sequenceProgress < 0.48) {
      const t = garbagebinliftv11EaseInOut(upPhase);
      binX = garbagebinliftv11Lerp(binBaseX, liftedX, t);
      binY = garbagebinliftv11Lerp(binBaseY, liftedY, t);
      rotation = garbagebinliftv11Lerp(0, liftedRotation, garbagebinliftv11EaseInOut(garbagebinliftv11Clamp((upPhase - 0.44) / 0.56, 0, 1)));
    } else if (sequenceProgress < 0.70) {
      binX = liftedX;
      binY = liftedY;
      rotation = liftedRotation;
    } else if (sequenceProgress < 0.88) {
      const t = garbagebinliftv11EaseInOut(downPhase);
      binX = garbagebinliftv11Lerp(liftedX, binBaseX, t);
      binY = garbagebinliftv11Lerp(liftedY, binBaseY, t);
      rotation = garbagebinliftv11Lerp(liftedRotation, 0, t);
    } else {
      binX = binBaseX;
      binY = binBaseY;
      rotation = 0;
    }

    const binInfo = { x: binX, y: binY, rotation, scale };
    garbagebinliftv11DrawBin(context, binX, binY, scale, rotation);
    garbagebinliftv11DrawBags(context, y, binInfo, sequenceProgress);
  }

  const gimmelthreedrumsv3WedgeColors = [
    '#e53935',
    '#fb8c00',
    '#fdd835',
    '#43a047',
    '#00bcd4',
    '#1e88e5',
    '#3949ab',
    '#8e24aa'
  ];
  function gimmelthreedrumsv3Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function gimmelthreedrumsv3Lerp(a, b, t) { return a + (b - a) * t; }
  function gimmelthreedrumsv3EaseInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function gimmelthreedrumsv3DrawSingleDrum(context, x, y, scale, rotation, isColored, includeHub) {
    const outerRadius = 58 * scale;
    const ringRadius = 44 * scale;
    const hubRadius = 8 * scale;
    const wedgeStartRadius = 10 * scale;
    const wedgeEndRadius = 42 * scale;

    context.save();
    context.translate(x, y - 18 * scale);
    context.rotate(rotation);
    context.fillStyle = '#9b6b41';
    context.beginPath();
    context.arc(0, 0, outerRadius, 0, Math.PI * 2);
    context.fill();

    if (isColored) {
      for (let i = 0; i < 8; i += 1) {
        const start = (Math.PI * 2 * i) / 8 + 0.03;
        const end = (Math.PI * 2 * (i + 1)) / 8 - 0.03;
        const mid = (start + end) / 2;
        context.save();
        context.fillStyle = gimmelthreedrumsv3WedgeColors[i];
        context.beginPath();
        context.moveTo(Math.cos(mid) * wedgeStartRadius, Math.sin(mid) * wedgeStartRadius);
        context.lineTo(Math.cos(start) * wedgeEndRadius, Math.sin(start) * wedgeEndRadius);
        context.lineTo(Math.cos(end) * wedgeEndRadius, Math.sin(end) * wedgeEndRadius);
        context.closePath();
        context.fill();
        context.restore();
      }
    }

    context.strokeStyle = '#70492b';
    context.lineWidth = 7 * scale;
    for (let i = 0; i < 8; i += 1) {
      context.save();
      context.rotate((Math.PI * 2 * i) / 8);
      context.beginPath();
      context.moveTo(-46 * scale, 0);
      context.lineTo(46 * scale, 0);
      context.stroke();
      context.restore();
    }

    context.strokeStyle = '#d3be9f';
    context.lineWidth = 6 * scale;
    context.beginPath();
    context.arc(0, 0, ringRadius, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(0, 0, outerRadius, 0, Math.PI * 2);
    context.stroke();

    if (includeHub) {
      context.fillStyle = '#d3be9f';
      context.beginPath();
      context.arc(0, 0, hubRadius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  function gimmelthreedrumsv3Draw(context, x, y, scale, elapsed, duration) {
    const progress = gimmelthreedrumsv3Clamp(elapsed / duration, 0, 1);
    const rotation = gimmelthreedrumsv3Lerp(0, Math.PI * 1.25, gimmelthreedrumsv3EaseInOut(gimmelthreedrumsv3Clamp(progress / 0.86, 0, 1)));
    const spacing = 135 * scale;
    gimmelthreedrumsv3DrawSingleDrum(context, x - spacing, y, scale, rotation, true, true);
    gimmelthreedrumsv3DrawSingleDrum(context, x, y, scale, rotation, false, false);
    gimmelthreedrumsv3DrawSingleDrum(context, x + spacing, y, scale, rotation, true, true);
  }

  function friendlystarshipglidev1Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function friendlystarshipglidev1Lerp(a, b, t) { return a + (b - a) * t; }
  function friendlystarshipglidev1EaseInOut(t) {
    t = friendlystarshipglidev1Clamp(t, 0, 1);
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  function friendlystarshipglidev1Phase(progress, start, end) {
    return friendlystarshipglidev1Clamp((progress - start) / (end - start), 0, 1);
  }
  function friendlystarshipglidev1RoundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }
  function friendlystarshipglidev1DrawStar(context, x, y, radius, color) {
    context.save();
    context.translate(x, y);
    context.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 === 0 ? radius : radius * 0.45;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
    context.fillStyle = color;
    context.fill();
    context.restore();
  }
  function friendlystarshipglidev1DrawShip(context, x, y, scale, noseGlow) {
    context.save();
    context.translate(x, y);
    context.fillStyle = '#d8e3f2';
    context.beginPath();
    context.moveTo(70 * scale, 0);
    context.quadraticCurveTo(10 * scale, -34 * scale, -70 * scale, -18 * scale);
    context.quadraticCurveTo(-36 * scale, 0, -70 * scale, 18 * scale);
    context.quadraticCurveTo(10 * scale, 34 * scale, 70 * scale, 0);
    context.fill();
    context.strokeStyle = '#53677c';
    context.lineWidth = 3 * scale;
    context.stroke();

    context.fillStyle = '#85d7ff';
    [-28, 0, 28].forEach(dx => {
      context.beginPath();
      context.arc(dx * scale, -5 * scale, 8 * scale, 0, Math.PI * 2);
      context.fill();
    });

    context.fillStyle = '#f7c96b';
    context.beginPath();
    context.moveTo(-68 * scale, -12 * scale);
    context.lineTo(-96 * scale, -25 * scale);
    context.lineTo(-88 * scale, -5 * scale);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(-68 * scale, 12 * scale);
    context.lineTo(-96 * scale, 25 * scale);
    context.lineTo(-88 * scale, 5 * scale);
    context.closePath();
    context.fill();

    if (noseGlow > 0) {
      context.fillStyle = 'rgba(255,216,77,.75)';
      context.beginPath();
      context.arc(72 * scale, 0, (5 + noseGlow) * scale, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  function friendlystarshipglidev1Draw(context, x, y, scale, elapsed, duration) {
    const progress = friendlystarshipglidev1Clamp(elapsed / duration, 0, 1);
    const stageW = 720 * scale;
    const stageH = 330 * scale;
    const left = x - stageW * 0.5;
    const top = y - stageH * 0.5;
    const glide = friendlystarshipglidev1EaseInOut(friendlystarshipglidev1Phase(progress, 0.05, 0.85));
    const shipX = friendlystarshipglidev1Lerp(left - 110 * scale, left + stageW + 110 * scale, glide);
    const shipY = y - 26 * scale + Math.sin(progress * Math.PI * 4) * 8 * scale;
    const starColors = ['#73d3ff', '#ffd84d', '#ff8da1', '#8ee17c', '#ffffff'];

    context.save();
    friendlystarshipglidev1RoundRect(context, left, top, stageW, stageH, 28 * scale);
    context.clip();
    context.fillStyle = '#0b1630';
    context.fillRect(left, top, stageW, stageH);

    for (let i = 0; i < 48; i += 1) {
      context.fillStyle = i % 5 === 0 ? '#ffd84d' : '#ffffff';
      context.beginPath();
      context.arc(left + ((i * 83 + 20) % 720) * scale, top + ((i * 47 + 31) % 330) * scale, 1.4 * scale + (i % 4) * 0.3 * scale, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = '#243b6b';
    context.beginPath();
    context.arc(left + stageW * 0.78, top + stageH * 0.74, 64 * scale, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#5bb3a5';
    context.beginPath();
    context.ellipse(left + stageW * 0.76, top + stageH * 0.71, 35 * scale, 12 * scale, -0.4, 0, Math.PI * 2);
    context.fill();

    friendlystarshipglidev1DrawShip(context, shipX, shipY, scale, friendlystarshipglidev1Phase(progress, 0.15, 0.85) * 3);
    for (let i = 0; i < 5; i += 1) {
      const sparkleT = friendlystarshipglidev1Phase(progress, 0.12 + i * 0.06, 0.65 + i * 0.06);
      if (sparkleT > 0 && sparkleT < 1) {
        friendlystarshipglidev1DrawStar(context, shipX - (90 + 30 * i) * scale, shipY + (i - 2) * 18 * scale, 7 * scale * (1 - sparkleT * 0.3), starColors[i]);
      }
    }
    context.restore();
  }

  function sofashufflefivepillowsv1Clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function sofashufflefivepillowsv1Lerp(a, b, t) { return a + (b - a) * t; }
  function sofashufflefivepillowsv1EaseInOut(t) {
    t = sofashufflefivepillowsv1Clamp(t, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function sofashufflefivepillowsv1EaseOut(t) {
    t = sofashufflefivepillowsv1Clamp(t, 0, 1);
    return 1 - Math.pow(1 - t, 3);
  }
  function sofashufflefivepillowsv1Phase(progress, start, end) {
    return sofashufflefivepillowsv1Clamp((progress - start) / (end - start), 0, 1);
  }
  function sofashufflefivepillowsv1RoundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }
  function sofashufflefivepillowsv1DrawPillow(context, x, y, width, height, radius, color, shadow) {
    context.save();
    context.translate(x, y);
    if (shadow) {
      context.fillStyle = 'rgba(0,0,0,.12)';
      context.beginPath();
      context.ellipse(0, height * 0.58, width * 0.42, height * 0.12, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = color;
    context.strokeStyle = '#7e90a3';
    context.lineWidth = 2.5 * (width / 78);
    sofashufflefivepillowsv1RoundRect(context, -width / 2, -height / 2, width, height, radius);
    context.fill();
    context.stroke();
    context.fillStyle = 'rgba(255,255,255,.45)';
    sofashufflefivepillowsv1RoundRect(context, -width * 0.28, -height * 0.24, width * 0.32, height * 0.12, radius * 0.45);
    context.fill();
    context.restore();
  }
  function sofashufflefivepillowsv1Draw(context, x, y, scale, elapsed, duration) {
    const progress = sofashufflefivepillowsv1Clamp(elapsed / duration, 0, 1);

    context.save();
    context.fillStyle = 'rgba(241,223,213,.68)';
    context.fillRect(x - 250 * scale, y + 70 * scale, 500 * scale, 44 * scale);
    for (let i = 0; i < 10; i += 1) {
      context.fillStyle = i % 2 ? 'rgba(234,215,204,.58)' : 'rgba(243,230,223,.58)';
      context.fillRect(x - 250 * scale + i * 50 * scale, y + 70 * scale, 50 * scale, 44 * scale);
    }

    context.translate(x, y);
    context.fillStyle = '#d87b4b';
    sofashufflefivepillowsv1RoundRect(context, -240 * scale, -92 * scale, 480 * scale, 130 * scale, 32 * scale);
    context.fill();
    context.strokeStyle = '#8b4e2e';
    context.lineWidth = 4 * scale;
    context.stroke();
    context.fillStyle = '#e79a67';
    sofashufflefivepillowsv1RoundRect(context, -228 * scale, -160 * scale, 456 * scale, 92 * scale, 28 * scale);
    context.fill();
    context.stroke();
    context.fillStyle = '#8b4e2e';
    sofashufflefivepillowsv1RoundRect(context, -246 * scale, 18 * scale, 492 * scale, 26 * scale, 10 * scale);
    context.fill();
    for (const legX of [-188, -65, 65, 188]) {
      context.fillStyle = '#7a452b';
      context.fillRect(legX * scale, 38 * scale, 18 * scale, 46 * scale);
    }
    context.restore();

    const colors = ['#a9ddff', '#ffc6e6', '#ffffff', '#ffc6e6', '#a9ddff'];
    const homeOffsets = [-150, -75, 0, 75, 150];
    const sideOffsets = [18, 8, 0, -8, -18];
    const pillowY = y - 95 * scale;
    const pillowW = 78 * scale;
    const pillowH = 58 * scale;
    for (let i = 0; i < 5; i += 1) {
      const segmentStart = 0.10 + i * 0.11;
      const up = sofashufflefivepillowsv1Phase(progress, segmentStart, segmentStart + 0.12);
      const down = sofashufflefivepillowsv1Phase(progress, segmentStart + 0.12, segmentStart + 0.24);
      const arch = up < 1 ? sofashufflefivepillowsv1EaseOut(up) : 1 - sofashufflefivepillowsv1EaseInOut(down);
      const side = up < 1 ? sofashufflefivepillowsv1Lerp(0, sideOffsets[i] * scale, sofashufflefivepillowsv1EaseOut(up)) : sofashufflefivepillowsv1Lerp(sideOffsets[i] * scale, 0, sofashufflefivepillowsv1EaseInOut(down));
      const lift = 28 * scale * Math.sin(Math.PI * sofashufflefivepillowsv1Clamp(arch, 0, 1));
      const settle = 2 * scale * Math.sin((progress * 4 + i) * Math.PI) * Math.max(0, 1 - sofashufflefivepillowsv1Phase(progress, 0.80, 1));
      sofashufflefivepillowsv1DrawPillow(context, x + homeOffsets[i] * scale + side, pillowY - lift + settle, pillowW, pillowH, 16 * scale, colors[i], true);
    }
  }

  function orangewhitegreenribbonv1Clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function orangewhitegreenribbonv1Lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function orangewhitegreenribbonv1Ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function orangewhitegreenribbonv1DrawStar(ctx, x, y, radius, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const r = i % 2 ? radius * 0.45 : radius;
      const angle = -Math.PI / 2 + i * Math.PI / 4;
      if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function orangewhitegreenribbonv1Draw(ctx, x, y, scale, elapsed, duration) {
    const p = orangewhitegreenribbonv1Clamp(elapsed / duration, 0, 1);
    ['#f28c28', '#fff', '#2e9d56'].forEach((color, i) => {
      const t = orangewhitegreenribbonv1Ease(orangewhitegreenribbonv1Clamp((p - i * 0.08) / 0.56, 0, 1));
      ctx.strokeStyle = color;
      ctx.lineWidth = 18 * scale;
      ctx.lineCap = 'round';
      ctx.shadowColor = color === '#fff' ? 'rgba(120,120,120,.25)' : 'rgba(0,0,0,.1)';
      ctx.shadowBlur = 6 * scale;
      ctx.beginPath();
      ctx.moveTo(x - 148 * scale, y - 42 * scale + i * 28 * scale);
      const endX = orangewhitegreenribbonv1Lerp(x - 148 * scale, x + 150 * scale, t);
      ctx.bezierCurveTo(x - 70 * scale, y - 118 * scale + i * 22 * scale, x + 60 * scale, y + 42 * scale - i * 16 * scale, endX, y - 42 * scale + i * 28 * scale);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
    if (p > 0.7) {
      orangewhitegreenribbonv1DrawStar(ctx, x + 132 * scale, y - 62 * scale, 7 * scale, '#ffd36a');
      orangewhitegreenribbonv1DrawStar(ctx, x + 110 * scale, y + 38 * scale, 6 * scale, '#2e9d56');
    }
  }

  function streetcarbellv1Clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function streetcarbellv1Lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function streetcarbellv1Ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function streetcarbellv1DrawStar(ctx, x, y, radius, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const r = i % 2 ? radius * 0.45 : radius;
      const angle = -Math.PI / 2 + i * Math.PI / 4;
      if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function streetcarbellv1RoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function streetcarbellv1Draw(ctx, x, y, scale, elapsed, duration) {
    const p = streetcarbellv1Clamp(elapsed / duration, 0, 1);
    const stageWidth = 900 * scale;
    const stageLeft = x - stageWidth * 0.5;
    const stageRight = x + stageWidth * 0.5;
    const tx = streetcarbellv1Lerp(stageLeft - 170 * scale, stageRight + 190 * scale, streetcarbellv1Ease(streetcarbellv1Clamp(p / 0.9, 0, 1)));
    ctx.strokeStyle = '#657481';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(stageLeft, y - 112 * scale);
    ctx.lineTo(stageRight, y - 112 * scale);
    ctx.stroke();
    ctx.fillStyle = '#4f5964';
    ctx.fillRect(stageLeft, y + 22 * scale, stageWidth, 8 * scale);
    ctx.save();
    ctx.translate(tx, y);
    ctx.fillStyle = '#d85c47';
    ctx.strokeStyle = '#7f3332';
    ctx.lineWidth = 3 * scale;
    streetcarbellv1RoundRect(ctx, -86 * scale, -62 * scale, 172 * scale, 64 * scale, 12 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2c24f';
    ctx.fillRect(-62 * scale, -84 * scale, 124 * scale, 24 * scale);
    ctx.fillStyle = '#dff4ff';
    [-52, -18, 18, 52].forEach(dx => ctx.fillRect((dx - 10) * scale, -44 * scale, 20 * scale, 18 * scale));
    ctx.fillStyle = '#2d3d4a';
    [-50, 50].forEach(dx => {
      ctx.beginPath();
      ctx.arc(dx * scale, 6 * scale, 11 * scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = '#5e5e5e';
    ctx.beginPath();
    ctx.moveTo(0, -84 * scale);
    ctx.lineTo(30 * scale, -112 * scale);
    ctx.stroke();
    ctx.restore();
    if (p > 0.42 && p < 0.58) {
      streetcarbellv1DrawStar(ctx, tx + 94 * scale, y - 84 * scale, 8 * scale, '#ffd36a');
    }
  }

  function cardinalv3DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 780, view.h / 560) * 2;
    const anchorX = clamp(pin.x, 60 * scale, view.w - 175 * scale);
    const anchorY = pin.y + layout.pinH * 0.58;
    cardinalv3Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function tropicalbirdv2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = view.w / 820;
    const anchorY = pin.y + layout.pinH * 0.58;
    tropicalbirdv2Draw(ctx, view.w * 0.48, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function rainbowbridgepopv2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 820, view.h / 560);
    const marginX = 160 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    rainbowbridgepopv2Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function mosaictileshimmerv2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 860, view.h / 560);
    const marginX = 110 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    mosaictileshimmerv2Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function columncircledancev2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 1080, view.h / 700);
    const marginX = 220 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    columncircledancev2Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function orangewhitegreenribbonv1DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 900, view.h / 560);
    const marginX = 160 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    orangewhitegreenribbonv1Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function streetcarbellv1DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = view.w / 900;
    const anchorY = pin.y + layout.pinH * 0.58;
    streetcarbellv1Draw(ctx, view.w * 0.5, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function campwagonv2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = view.w / 900;
    const anchorY = pin.y + layout.pinH * 0.58;
    campwagonv2Draw(ctx, view.w * 0.5, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function flowerwavev2DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 900, view.h / 560);
    const marginX = 170 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.58;
    flowerwavev2Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function garbagebinliftv11DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 760, view.h / 520);
    const marginX = 230 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = Math.min(pin.y + layout.pinH * 0.64, view.h - 44 * scale);
    garbagebinliftv11Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration, view.w);
  }

  function gimmelthreedrumsv3DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 620, view.h / 430);
    const marginX = 190 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = pin.y + layout.pinH * 0.30;
    gimmelthreedrumsv3Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }

  function friendlystarshipglidev1DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 820, view.h / 540);
    const anchorX = view.w * 0.5;
    const anchorY = view.h * 0.5;
    friendlystarshipglidev1Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }
  // =====================================================
  // =====================================================
  // KANGAROO POUCH SURPRISE v7 SPECIAL ANIMATION
  // Source: kangaroopouchsurprise-integration-v7.js
  // =====================================================
  const KANGAROOPOUCHSURPRISE_DURATION_MS = 7000;
  const KANGAROOPOUCHSURPRISE_PALETTES = [
    { fur: '#b87946', shade: '#6f422b', dark: '#4f3024', light: '#dfa978', belly: '#efd1a9', inner: '#d99183' },
    { fur: '#c3915c', shade: '#775638', dark: '#523a29', light: '#e8bf8d', belly: '#f0d7b4', inner: '#da9c8d' }
  ];
  const KANGAROOPOUCHSURPRISE_HOP_DISTANCES = [64, 96, 144];
  const KANGAROOPOUCHSURPRISE_START_X = -160;
  
  const KANGAROOPOUCHSURPRISE_HOP_KEYS = [
    { t: 0.00, lift: 0,  x: 0, pitch: 0.00, squash: 1.00, hip:[-5,-96], knee:[27,-58], ankle:[12,-19], toe:[61,0], tailTip:[-173,-6], tailMid:[-103,-47], arm:-0.08, ear:0.00 },
    { t: 0.16, lift:-7, x:-3, pitch: 0.18, squash: 0.93, hip:[-4,-86], knee:[42,-53], ankle:[18,-10], toe:[64,0], tailTip:[-176,-3], tailMid:[-106,-43], arm:0.18, ear:-0.08 },
    { t: 0.28, lift:18, x: 4, pitch:-0.11, squash: 1.04, hip:[-5,-116], knee:[9,-70], ankle:[-12,-27], toe:[2,-1], tailTip:[-182,-36], tailMid:[-110,-85], arm:-0.35, ear:0.12 },
    { t: 0.43, lift:58, x: 9, pitch:-0.06, squash: 1.00, hip:[-4,-153], knee:[34,-126], ankle:[16,-99], toe:[42,-86], tailTip:[-185,-92], tailMid:[-110,-140], arm:-0.10, ear:0.06 },
    { t: 0.56, lift:70, x:16, pitch: 0.04, squash: 1.00, hip:[-3,-165], knee:[47,-140], ankle:[27,-116], toe:[63,-104], tailTip:[-183,-100], tailMid:[-112,-150], arm:0.12, ear:-0.02 },
    { t: 0.70, lift:43, x:14, pitch: 0.15, squash: 0.99, hip:[-3,-137], knee:[52,-103], ankle:[40,-57], toe:[82,-20], tailTip:[-180,-82], tailMid:[-110,-128], arm:0.25, ear:-0.08 },
    { t: 0.82, lift:1,  x: 7, pitch: 0.20, squash: 0.94, hip:[-4,-99], knee:[45,-66], ankle:[42,-23], toe:[84,0], tailTip:[-178,-45], tailMid:[-109,-85], arm:0.14, ear:-0.12 },
    { t: 0.92, lift:-5, x: 2, pitch: 0.07, squash: 0.95, hip:[-5,-89], knee:[36,-57], ankle:[23,-13], toe:[69,0], tailTip:[-176,-18], tailMid:[-106,-62], arm:-0.02, ear:-0.03 },
    { t: 1.00, lift:0,  x: 0, pitch: 0.00, squash: 1.00, hip:[-5,-96], knee:[27,-58], ankle:[12,-19], toe:[61,0], tailTip:[-173,-6], tailMid:[-103,-47], arm:-0.08, ear:0.00 }
  ];
  
  function kangaroopouchsurpriseClamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function kangaroopouchsurpriseLerp(a, b, amount) { return a + (b - a) * amount; }
  function kangaroopouchsurpriseSmoothstep(edge0, edge1, value) {
    const t = kangaroopouchsurpriseClamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function kangaroopouchsurpriseEaseOutCubic(value) {
    const t = 1 - kangaroopouchsurpriseClamp(value, 0, 1);
    return 1 - t * t * t;
  }
  function kangaroopouchsurpriseEaseInOutCubic(value) {
    const t = kangaroopouchsurpriseClamp(value, 0, 1);
    return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function kangaroopouchsurpriseWindow(value, start, end) {
    const t = kangaroopouchsurpriseClamp((value - start) / (end - start), 0, 1);
    return Math.sin(t * Math.PI);
  }
  function kangaroopouchsurprisePointLerp(a, b, amount) {
    return [kangaroopouchsurpriseLerp(a[0], b[0], amount), kangaroopouchsurpriseLerp(a[1], b[1], amount)];
  }
  function kangaroopouchsurpriseSampleHopPose(value) {
    const t = kangaroopouchsurpriseClamp(value, 0, 1);
    let a = KANGAROOPOUCHSURPRISE_HOP_KEYS[0];
    let b = KANGAROOPOUCHSURPRISE_HOP_KEYS[KANGAROOPOUCHSURPRISE_HOP_KEYS.length - 1];
    for (let i = 0; i < KANGAROOPOUCHSURPRISE_HOP_KEYS.length - 1; i += 1) {
      if (t >= KANGAROOPOUCHSURPRISE_HOP_KEYS[i].t && t <= KANGAROOPOUCHSURPRISE_HOP_KEYS[i + 1].t) {
        a = KANGAROOPOUCHSURPRISE_HOP_KEYS[i]; b = KANGAROOPOUCHSURPRISE_HOP_KEYS[i + 1]; break;
      }
    }
    const raw = (t - a.t) / Math.max(.0001, b.t - a.t);
    const m = kangaroopouchsurpriseEaseInOutCubic(raw);
    return {
      lift: kangaroopouchsurpriseLerp(a.lift, b.lift, m),
      x: kangaroopouchsurpriseLerp(a.x, b.x, m),
      pitch: kangaroopouchsurpriseLerp(a.pitch, b.pitch, m),
      squash: kangaroopouchsurpriseLerp(a.squash, b.squash, m),
      hip: kangaroopouchsurprisePointLerp(a.hip, b.hip, m),
      knee: kangaroopouchsurprisePointLerp(a.knee, b.knee, m),
      ankle: kangaroopouchsurprisePointLerp(a.ankle, b.ankle, m),
      toe: kangaroopouchsurprisePointLerp(a.toe, b.toe, m),
      tailTip: kangaroopouchsurprisePointLerp(a.tailTip, b.tailTip, m),
      tailMid: kangaroopouchsurprisePointLerp(a.tailMid, b.tailMid, m),
      arm: kangaroopouchsurpriseLerp(a.arm, b.arm, m),
      ear: kangaroopouchsurpriseLerp(a.ear, b.ear, m),
      airborne: kangaroopouchsurpriseSmoothstep(.25,.37,t) * (1-kangaroopouchsurpriseSmoothstep(.72,.83,t)),
      compression: kangaroopouchsurpriseWindow(t,0,.29) + .65*kangaroopouchsurpriseWindow(t,.72,1)
    };
  }
  function kangaroopouchsurpriseRestPose() { return kangaroopouchsurpriseSampleHopPose(0); }
  function kangaroopouchsurpriseBlendPose(base, active, amount) {
    const m = kangaroopouchsurpriseClamp(amount,0,1);
    return {
      lift:kangaroopouchsurpriseLerp(base.lift,active.lift,m), x:kangaroopouchsurpriseLerp(base.x,active.x,m),
      pitch:kangaroopouchsurpriseLerp(base.pitch,active.pitch,m), squash:kangaroopouchsurpriseLerp(base.squash,active.squash,m),
      hip:kangaroopouchsurprisePointLerp(base.hip,active.hip,m), knee:kangaroopouchsurprisePointLerp(base.knee,active.knee,m),
      ankle:kangaroopouchsurprisePointLerp(base.ankle,active.ankle,m), toe:kangaroopouchsurprisePointLerp(base.toe,active.toe,m),
      tailTip:kangaroopouchsurprisePointLerp(base.tailTip,active.tailTip,m), tailMid:kangaroopouchsurprisePointLerp(base.tailMid,active.tailMid,m),
      arm:kangaroopouchsurpriseLerp(base.arm,active.arm,m), ear:kangaroopouchsurpriseLerp(base.ear,active.ear,m),
      airborne:kangaroopouchsurpriseLerp(base.airborne,active.airborne,m), compression:kangaroopouchsurpriseLerp(base.compression,active.compression,m)
    };
  }
  
  function kangaroopouchsurpriseDrawCapsule(ctx, ax, ay, bx, by, radiusA, radiusB, fill, stroke, lineWidth) {
    const dx=bx-ax, dy=by-ay, len=Math.max(.001,Math.hypot(dx,dy)), nx=-dy/len, ny=dx/len;
    ctx.save(); ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=lineWidth; ctx.lineJoin='round';
    ctx.beginPath(); ctx.moveTo(ax+nx*radiusA,ay+ny*radiusA); ctx.lineTo(bx+nx*radiusB,by+ny*radiusB);
    ctx.arc(bx,by,radiusB,Math.atan2(ny,nx),Math.atan2(-ny,-nx));
    ctx.lineTo(ax-nx*radiusA,ay-ny*radiusA); ctx.arc(ax,ay,radiusA,Math.atan2(-ny,-nx),Math.atan2(ny,nx)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function kangaroopouchsurpriseDrawHindLeg(ctx, pose, palette, back) {
    const offX=back?-9:5, offY=back?-2:1;
    const hip=[pose.hip[0]+offX,pose.hip[1]+offY], knee=[pose.knee[0]+offX,pose.knee[1]+offY], ankle=[pose.ankle[0]+offX,pose.ankle[1]+offY], toe=[pose.toe[0]+offX,pose.toe[1]+offY];
    const fill=back?palette.shade:palette.fur, outline=palette.dark;
    kangaroopouchsurpriseDrawCapsule(ctx,hip[0],hip[1],knee[0],knee[1],24,17,fill,outline,4.2);
    kangaroopouchsurpriseDrawCapsule(ctx,knee[0],knee[1],ankle[0],ankle[1],15,10,fill,outline,4.2);
    // v7: preserve the v5 animation design, but restore the missing knee mass so the leg reads as a continuous limb.
    const thighAngle=Math.atan2(knee[1]-hip[1],knee[0]-hip[0]);
    const shinAngle=Math.atan2(ankle[1]-knee[1],ankle[0]-knee[0]);
    let bisector=(thighAngle+shinAngle)/2;
    if (Math.abs(thighAngle-shinAngle)>Math.PI) bisector+=Math.PI;
    ctx.save();
    ctx.translate(knee[0],knee[1]);
    ctx.rotate(bisector-Math.PI/2);
    ctx.fillStyle=fill;
    ctx.strokeStyle=outline;
    ctx.lineWidth=4.2;
    ctx.beginPath();
    ctx.ellipse(0,0,17.5,13.5,0,0,Math.PI*2);
    ctx.fill();
    // Only outline the exposed outside edge so the knee blends into the thigh and shin.
    ctx.beginPath();
    ctx.arc(0,0,15.6,-2.58,.78);
    ctx.stroke();
    ctx.strokeStyle=back?palette.dark:palette.light;
    ctx.globalAlpha=back?0.22:0.34;
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(1,-1,9.2,-2.36,-.92);
    ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.fillStyle=fill; ctx.strokeStyle=outline; ctx.lineWidth=4.2; ctx.lineJoin='round';
    const dx=toe[0]-ankle[0],dy=toe[1]-ankle[1],len=Math.max(1,Math.hypot(dx,dy)),nx=-dy/len,ny=dx/len;
    ctx.beginPath(); ctx.moveTo(ankle[0]+nx*10,ankle[1]+ny*10); ctx.lineTo(toe[0]+nx*7,toe[1]+ny*7);
    ctx.quadraticCurveTo(toe[0]+14,toe[1]+5,toe[0]+15,toe[1]-1); ctx.quadraticCurveTo(toe[0]+5,toe[1]-8,toe[0]-nx*5,toe[1]-ny*5);
    ctx.lineTo(ankle[0]-nx*10,ankle[1]-ny*10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle=palette.shade; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(toe[0]+2,toe[1]-2); ctx.lineTo(toe[0]+12,toe[1]-1); ctx.stroke(); ctx.restore();
  }
  function kangaroopouchsurpriseTransformBodyPoint(pose, point) {
    const px=point[0], py=point[1]*pose.squash;
    const c=Math.cos(pose.pitch), s=Math.sin(pose.pitch);
    return [pose.x+px*c-py*s, -pose.lift+px*s+py*c];
  }
  function kangaroopouchsurpriseDrawTail(ctx, pose, palette) {
    const base=kangaroopouchsurpriseTransformBodyPoint(pose,[-36,-104]);
    const mid=[pose.tailMid[0]+pose.x*.35,pose.tailMid[1]];
    const tip=[pose.tailTip[0]+pose.x*.15,pose.tailTip[1]];
    const grad=ctx.createLinearGradient(tip[0],tip[1],base[0],base[1]); grad.addColorStop(0,palette.shade); grad.addColorStop(1,palette.fur);
    ctx.save(); ctx.fillStyle=grad; ctx.strokeStyle=palette.dark; ctx.lineWidth=4.5; ctx.lineJoin='round';
    ctx.beginPath(); ctx.moveTo(base[0]-2,base[1]-19); ctx.bezierCurveTo(mid[0],mid[1]-19,tip[0]-7,tip[1]-8,tip[0],tip[1]);
    ctx.bezierCurveTo(tip[0]+10,tip[1]+8,mid[0]+15,mid[1]+21,base[0]+11,base[1]+19); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function kangaroopouchsurpriseDrawJoey(ctx, x, y, scale, palette, peek, blink, bounce, sway) {
    if (peek <= 0) return;
    ctx.save(); ctx.translate(x+sway,y+bounce); ctx.scale(scale,scale); ctx.globalAlpha=peek; ctx.lineJoin='round';
    const lift=kangaroopouchsurpriseLerp(31,0,kangaroopouchsurpriseEaseOutCubic(peek)); ctx.translate(0,lift);
    ctx.fillStyle=palette.fur; ctx.strokeStyle=palette.dark; ctx.lineWidth=3.5;
    ctx.beginPath(); ctx.ellipse(0,-8,25,29,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle=palette.light;
    for (const [ex,rot] of [[-10,-.13],[12,.11]]) { ctx.save(); ctx.translate(ex,-31); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0,-22,8,29,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle='#29251f'; ctx.beginPath(); ctx.ellipse(10,-12,3.5,blink>.6?1:4,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(24,-2,4,3,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
  function kangaroopouchsurpriseDrawArm(ctx, shoulderX, shoulderY, angle, palette, back, pat) {
    ctx.save(); ctx.translate(shoulderX,shoulderY); ctx.rotate(angle); const fill=back?palette.shade:palette.fur;
    kangaroopouchsurpriseDrawCapsule(ctx,0,0,4,43,9,7,fill,palette.dark,3.5);
    ctx.translate(4,43); ctx.rotate(-.36-pat*.34); kangaroopouchsurpriseDrawCapsule(ctx,0,0,20,22,7,5,fill,palette.dark,3.3);
    ctx.restore();
  }
  function kangaroopouchsurpriseDrawTurningHead(ctx, palette, blink, pose, headTurn) {
    const turn=kangaroopouchsurpriseEaseInOutCubic(kangaroopouchsurpriseClamp(headTurn,0,1));
    const headShiftX=kangaroopouchsurpriseLerp(0,-15,turn);
    const headShiftY=kangaroopouchsurpriseLerp(0,2,turn);
    const headRotation=-pose.pitch*.45+pose.ear*.28-kangaroopouchsurpriseLerp(0,.035,turn);
    const skullX=kangaroopouchsurpriseLerp(4,0,turn);
    const skullY=kangaroopouchsurpriseLerp(-12,-10,turn);
    const skullW=kangaroopouchsurpriseLerp(39,43,turn);
    const skullH=kangaroopouchsurpriseLerp(42,44,turn);
    const muzzleX=kangaroopouchsurpriseLerp(34,0,turn);
    const muzzleY=kangaroopouchsurpriseLerp(2,7,turn);
    const muzzleW=kangaroopouchsurpriseLerp(30,27,turn);
    const muzzleH=kangaroopouchsurpriseLerp(20,23,turn);
    const muzzleRotation=kangaroopouchsurpriseLerp(.07,0,turn);
    ctx.save();
    ctx.translate(25+headShiftX,-253+headShiftY);
    ctx.rotate(headRotation);
    ctx.fillStyle=palette.fur; ctx.strokeStyle=palette.dark; ctx.lineWidth=4.2; ctx.lineJoin='round';
    ctx.beginPath(); ctx.ellipse(skullX,skullY,skullW,skullH,kangaroopouchsurpriseLerp(.08,0,turn),0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle=palette.light; ctx.beginPath(); ctx.ellipse(muzzleX,muzzleY,muzzleW,muzzleH,muzzleRotation,0,Math.PI*2); ctx.fill(); ctx.stroke();
    const earPositions=[
      [kangaroopouchsurpriseLerp(-18,-21,turn),kangaroopouchsurpriseLerp(-.16,-.12,turn)],
      [kangaroopouchsurpriseLerp(14,21,turn),kangaroopouchsurpriseLerp(.12,.12,turn)]
    ];
    for (const [ex,rot] of earPositions) {
      ctx.save(); ctx.translate(ex,-44); ctx.rotate(rot+pose.ear*(1-.35*turn));
      ctx.fillStyle=palette.fur; ctx.beginPath(); ctx.ellipse(0,-29,12,40,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle=palette.inner; ctx.beginPath(); ctx.ellipse(0,-29,5,27,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    const eyeY=kangaroopouchsurpriseLerp(-17,-15,turn);
    const rightEyeX=kangaroopouchsurpriseLerp(16,14,turn);
    const leftEyeX=-14;
    const eyeHeight=blink>.65?1:5;
    ctx.fillStyle='#2a2620';
    ctx.beginPath(); ctx.ellipse(rightEyeX,eyeY,4,eyeHeight,0,0,Math.PI*2); ctx.fill();
    const secondEyeAlpha=kangaroopouchsurpriseSmoothstep(.22,.72,turn);
    ctx.save(); ctx.globalAlpha=secondEyeAlpha; ctx.beginPath(); ctx.ellipse(leftEyeX,eyeY,4,eyeHeight,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    const noseX=kangaroopouchsurpriseLerp(56,0,turn);
    const noseY=kangaroopouchsurpriseLerp(3,9,turn);
    ctx.beginPath(); ctx.ellipse(noseX,noseY,kangaroopouchsurpriseLerp(5,6,turn),kangaroopouchsurpriseLerp(4,4.5,turn),0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=palette.shade; ctx.lineWidth=2.5;
    ctx.beginPath();
    if (turn < .55) {
      const sideAmount=1-turn/.55;
      ctx.arc(kangaroopouchsurpriseLerp(4,43,sideAmount),kangaroopouchsurpriseLerp(15,10,sideAmount),10,.45,1.45);
    } else {
      ctx.moveTo(-7,18); ctx.quadraticCurveTo(0,22,7,18);
    }
    ctx.stroke();
    ctx.restore();
  }
  
  function kangaroopouchsurpriseDrawKangaroo(ctx, x, groundY, scale, direction, palette, reveal, pose, joeyPeek, pat, blink, hopEnergy, headTurn) {
    if (reveal <= 0) return;
    ctx.save(); ctx.translate(x,groundY); ctx.scale(scale*direction,scale); ctx.globalAlpha=reveal; ctx.lineCap='round'; ctx.lineJoin='round';
    const shadowAlpha=.18*(1-.72*pose.airborne); const shadowWidth=88-20*pose.airborne;
    ctx.fillStyle=`rgba(57,49,39,${shadowAlpha})`; ctx.beginPath(); ctx.ellipse(4,5,shadowWidth,12-3*pose.airborne,0,0,Math.PI*2); ctx.fill();
    // The tail swings opposite the forward-reaching feet to stabilize body pitch during flight.
    kangaroopouchsurpriseDrawTail(ctx,pose,palette);
    kangaroopouchsurpriseDrawHindLeg(ctx,pose,palette,true);
    // Body follows a crouch, spring release, flight arc, and landing recoil rather than translating rigidly.
    ctx.save(); ctx.translate(pose.x,-pose.lift); ctx.rotate(pose.pitch); ctx.scale(1,pose.squash);
    const bodyGrad=ctx.createLinearGradient(-46,-215,60,-62); bodyGrad.addColorStop(0,palette.light); bodyGrad.addColorStop(.44,palette.fur); bodyGrad.addColorStop(1,palette.shade);
    ctx.fillStyle=bodyGrad; ctx.strokeStyle=palette.dark; ctx.lineWidth=4.5;
    ctx.beginPath(); ctx.moveTo(-43,-104); ctx.bezierCurveTo(-50,-158,-22,-205,15,-209); ctx.bezierCurveTo(55,-210,70,-168,57,-113); ctx.bezierCurveTo(49,-77,25,-65,-3,-67); ctx.bezierCurveTo(-24,-69,-40,-82,-43,-104); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=palette.belly; ctx.beginPath(); ctx.ellipse(18,-124,36,57,.05,0,Math.PI*2); ctx.fill();
    // Pouch rim flexes slightly after impact; the joey lags behind the adult's vertical motion.
    const pouchFlex=2.5*hopEnergy;
    ctx.fillStyle=palette.belly; ctx.strokeStyle=palette.shade; ctx.lineWidth=3.6;
    ctx.beginPath(); ctx.moveTo(-13,-135+pouchFlex); ctx.quadraticCurveTo(13,-108-pouchFlex,43,-132+pouchFlex); ctx.quadraticCurveTo(38,-75,3,-78); ctx.quadraticCurveTo(-18,-91,-13,-135+pouchFlex); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Neck and shoulders remain attached while the head yaws toward the player after the final landing.
    const neckTurn=kangaroopouchsurpriseEaseInOutCubic(kangaroopouchsurpriseClamp(headTurn,0,1));
    ctx.fillStyle=palette.fur; ctx.strokeStyle=palette.dark; ctx.lineWidth=4.2;
    ctx.beginPath();
    ctx.moveTo(-20,-184);
    ctx.quadraticCurveTo(kangaroopouchsurpriseLerp(-8,-15,neckTurn),-238,kangaroopouchsurpriseLerp(21,7,neckTurn),-252);
    ctx.quadraticCurveTo(kangaroopouchsurpriseLerp(48,32,neckTurn),-228,kangaroopouchsurpriseLerp(42,34,neckTurn),-175);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    kangaroopouchsurpriseDrawArm(ctx,-26,-181,-.12+pose.arm*.55,palette,true,0);
    kangaroopouchsurpriseDrawArm(ctx,31,-181,.11+pose.arm*.42,palette,false,pat);
    // The profile smoothly becomes a front-facing head, with the second eye and centered muzzle appearing during the turn.
    kangaroopouchsurpriseDrawTurningHead(ctx,palette,blink,pose,neckTurn);
    const joeyLag=pose.airborne*4-pose.compression*2; const joeySway=-pose.pitch*12;
    kangaroopouchsurpriseDrawJoey(ctx,14,-139,.78,palette,joeyPeek,blink,joeyLag,joeySway);
    ctx.restore();
    kangaroopouchsurpriseDrawHindLeg(ctx,pose,palette,false);
    ctx.restore();
  }
  function kangaroopouchsurpriseDrawAnimation(ctx,x,y,scale,elapsed,duration,variant=0) {
    const progress=kangaroopouchsurpriseClamp(elapsed/duration,0,1);
    const vi=Math.abs(Math.floor(variant))%KANGAROOPOUCHSURPRISE_PALETTES.length;
    const palette=KANGAROOPOUCHSURPRISE_PALETTES[vi];
    const direction=1;
    // Phase 1: the adult rises into a stable starting stance behind the anchor.
    const reveal=kangaroopouchsurpriseEaseOutCubic(kangaroopouchsurpriseSmoothstep(.03,.21,progress));
    const rise=kangaroopouchsurpriseLerp(118,0,reveal);
    // Phase 2: the joey emerges before locomotion begins.
    const peek=kangaroopouchsurpriseEaseOutCubic(kangaroopouchsurpriseSmoothstep(.17,.29,progress));
    // Phase 3: three complete articulated hops. Each hop advances exactly 50% farther than the preceding hop.
    let pose=kangaroopouchsurpriseRestPose();
    let hopEnergy=0;
    let travelX=KANGAROOPOUCHSURPRISE_START_X;
    const hopWindows=[[.28,.44],[.46,.64],[.66,.85]];
    let hopStartX=KANGAROOPOUCHSURPRISE_START_X;
    for (let i=0;i<hopWindows.length;i+=1) {
      const start=hopWindows[i][0],end=hopWindows[i][1];
      const hopDistance=KANGAROOPOUCHSURPRISE_HOP_DISTANCES[i];
      if (progress>end) {
        travelX=hopStartX+hopDistance;
        hopStartX+=hopDistance;
        continue;
      }
      if (progress>=start) {
        const local=(progress-start)/(end-start);
        const active=kangaroopouchsurpriseSampleHopPose(local);
        const blend=kangaroopouchsurpriseSmoothstep(start,start+.015,progress)*(1-kangaroopouchsurpriseSmoothstep(end-.015,end,progress));
        pose=kangaroopouchsurpriseBlendPose(pose,active,blend);
        hopEnergy=Math.max(hopEnergy,active.compression*.65+active.airborne);
        const forwardPhase=kangaroopouchsurpriseSmoothstep(.10,.92,local);
        travelX=hopStartX+hopDistance*forwardPhase;
        break;
      }
    }
    // Phase 4: after the third landing, the adult turns its head toward the game player, then pats the pouch and blinks once.
    const headTurn=kangaroopouchsurpriseSmoothstep(.875,.965,progress);
    const pat=kangaroopouchsurpriseWindow(progress,.91,.975);
    const blink=kangaroopouchsurpriseWindow(progress,.945,.985);
    ctx.save();
    kangaroopouchsurpriseDrawKangaroo(ctx,x+travelX*scale,y+rise*scale,scale*.90,direction,palette,reveal,pose,peek,pat,blink,hopEnergy,headTurn);
    ctx.restore();
  }

  function kangaroopouchsurpriseDrawPin(pin, current) {
    const elapsed = Math.min(current - pin.rocket.startedAt, KANGAROOPOUCHSURPRISE_DURATION_MS);
    const naturalScale = Math.min(view.w / 720, view.h / 720);
    const maxScaleX = (view.w - 16) / 610;
    const maxScaleY = (view.h - 16) / 425;
    const scale = Math.min(naturalScale, maxScaleX, maxScaleY);
    const leftExtent = 330 * scale;
    const rightExtent = 280 * scale;
    const topExtent = 400 * scale;
    const bottomExtent = 25 * scale;
    const intendedAnchorX = pin.x;
    const anchorX = clamp(intendedAnchorX, leftExtent + 8, view.w - rightExtent - 8);
    const intendedAnchorY = pin.y + layout.pinH * 0.58;
    const anchorY = clamp(intendedAnchorY, topExtent + 8, view.h - bottomExtent - 8);
    kangaroopouchsurpriseDrawAnimation(
      ctx,
      anchorX,
      anchorY,
      scale,
      elapsed,
      KANGAROOPOUCHSURPRISE_DURATION_MS,
      pin.rocket.variant
    );
  }

  // =====================================================
  // WOMBAT BURROW BUILDER v4 SPECIAL ANIMATION
  // Source: wombatburrowbuilder-integration-v4.js
  // =====================================================
  const WOMBATBURROWBUILDER_DURATION_MS = 5600;
  const WOMBATBURROWBUILDER_PLACEMENT = {
    policy: "containAll",
    margin: 8,
    bounds: { minX: -190, maxX: 264, minY: -175, maxY: 24 },
    mirroredVariants: [1]
  };
  let wombatburrowbuilderLastPlacement = null;

  const WOMBATBURROWBUILDER_PALETTES = [
    {
      earth: '#a8794f', earthDark: '#68452f', earthLight: '#c69a6c',
      fur: '#81736a', furDark: '#4f4742', furLight: '#b2a69e',
      muzzle: '#a29187', nose: '#332d2a', claw: '#443a34'
    },
    {
      earth: '#997052', earthDark: '#5d4233', earthLight: '#c39572',
      fur: '#75685f', furDark: '#47403b', furLight: '#aa9d93',
      muzzle: '#98877e', nose: '#302b28', claw: '#403731'
    },
    {
      earth: '#b18358', earthDark: '#704d34', earthLight: '#d0a374',
      fur: '#8a7868', furDark: '#52463e', furLight: '#b9a79a',
      muzzle: '#a99486', nose: '#362f2b', claw: '#493d35'
    }
  ];

  function wombatburrowbuilderClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function wombatburrowbuilderLerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function wombatburrowbuilderSmoothstep(edge0, edge1, value) {
    const t = wombatburrowbuilderClamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function wombatburrowbuilderEaseOutCubic(value) {
    const t = 1 - wombatburrowbuilderClamp(value, 0, 1);
    return 1 - t * t * t;
  }

  function wombatburrowbuilderEaseInOutCubic(value) {
    const t = wombatburrowbuilderClamp(value, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function wombatburrowbuilderWindow(value, start, end) {
    const t = wombatburrowbuilderClamp((value - start) / (end - start), 0, 1);
    return Math.sin(t * Math.PI);
  }

  function wombatburrowbuilderMoundPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-184, 0);
    ctx.quadraticCurveTo(-174, -86, -124, -126);
    ctx.quadraticCurveTo(-71, -157, -14, -118);
    ctx.quadraticCurveTo(29, -86, 42, 0);
    ctx.closePath();
  }

  function wombatburrowbuilderOpeningPath(ctx) {
    ctx.moveTo(-112, 2);
    ctx.lineTo(-112, -35);
    ctx.bezierCurveTo(-109, -79, -79, -105, -41, -105);
    ctx.bezierCurveTo(-3, -105, 22, -79, 24, -36);
    ctx.lineTo(24, 2);
    ctx.closePath();
  }

  function wombatburrowbuilderCreateEarthGradient(ctx, palette) {
    const gradient = ctx.createLinearGradient(-80, -148, -25, 8);
    gradient.addColorStop(0, palette.earthLight);
    gradient.addColorStop(0.55, palette.earth);
    gradient.addColorStop(1, palette.earthDark);
    return gradient;
  }

  function wombatburrowbuilderDrawMoundBack(ctx, palette, growth, opening) {
    ctx.save();
    ctx.globalAlpha = growth;
    ctx.fillStyle = wombatburrowbuilderCreateEarthGradient(ctx, palette);
    ctx.strokeStyle = palette.earthDark;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    wombatburrowbuilderMoundPath(ctx);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = growth * opening;
    const tunnelGradient = ctx.createRadialGradient(-46, -55, 8, -46, -55, 94);
    tunnelGradient.addColorStop(0, '#1e1714');
    tunnelGradient.addColorStop(0.7, '#35271f');
    tunnelGradient.addColorStop(1, '#594031');
    ctx.fillStyle = tunnelGradient;
    ctx.beginPath();
    wombatburrowbuilderOpeningPath(ctx);
    ctx.fill();

    // A dim floor inside the tunnel makes the exit direction clear.
    ctx.fillStyle = 'rgba(190, 145, 101, .22)';
    ctx.beginPath();
    ctx.ellipse(-43, -3, 67, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function wombatburrowbuilderDrawMoundForeground(ctx, palette, growth, opening) {
    ctx.save();
    ctx.globalAlpha = growth;
    ctx.fillStyle = wombatburrowbuilderCreateEarthGradient(ctx, palette);
    wombatburrowbuilderMoundPath(ctx);
    wombatburrowbuilderOpeningPath(ctx);
    ctx.fill('evenodd');

    ctx.strokeStyle = palette.earthDark;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    wombatburrowbuilderMoundPath(ctx);
    ctx.stroke();

    ctx.globalAlpha = growth * opening;
    ctx.strokeStyle = palette.earthDark;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-112, 0);
    ctx.lineTo(-112, -35);
    ctx.bezierCurveTo(-109, -79, -79, -105, -41, -105);
    ctx.bezierCurveTo(-3, -105, 22, -79, 24, -36);
    ctx.lineTo(24, 0);
    ctx.stroke();

    ctx.strokeStyle = palette.earthLight;
    ctx.lineWidth = 3;
    ctx.globalAlpha = growth * opening * 0.62;
    ctx.beginPath();
    ctx.moveTo(-104, -39);
    ctx.bezierCurveTo(-98, -72, -73, -94, -41, -94);
    ctx.bezierCurveTo(-9, -94, 11, -72, 15, -39);
    ctx.stroke();

    // Loose rim texture is fixed in place; no loose soil pieces are used.
    ctx.strokeStyle = 'rgba(88, 58, 39, .35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-145, -33);
    ctx.quadraticCurveTo(-132, -42, -119, -37);
    ctx.moveTo(-91, -119);
    ctx.quadraticCurveTo(-74, -127, -58, -121);
    ctx.moveTo(-6, -98);
    ctx.quadraticCurveTo(7, -91, 17, -78);
    ctx.stroke();
    ctx.restore();
  }

  function wombatburrowbuilderComputeLegPose(walkPhase, offset, activity, neutralX) {
    let phase = (walkPhase + offset) % 1;
    if (phase < 0) phase += 1;
    let footShift = 0;
    let lift = 0;
    if (phase < 0.72) {
      const t = phase / 0.72;
      footShift = wombatburrowbuilderLerp(12, -12, t);
    } else {
      const t = (phase - 0.72) / 0.28;
      footShift = wombatburrowbuilderLerp(-12, 12, t);
      lift = Math.sin(t * Math.PI) * 13;
    }
    return {
      x: neutralX + footShift * activity,
      y: -2 - lift * activity,
      lift: lift * activity
    };
  }

  function wombatburrowbuilderDrawLeg(
    ctx, palette, attachX, attachY, footX, footY, farSide, foreleg
  ) {
    const tone = farSide ? palette.furDark : palette.fur;
    const outline = palette.furDark;
    const kneeX = wombatburrowbuilderLerp(attachX, footX, foreleg ? 0.44 : 0.52)
      + (foreleg ? 5 : -4);
    const kneeY = wombatburrowbuilderLerp(attachY, footY, 0.56) - (foreleg ? 1 : 3);

    ctx.save();
    ctx.strokeStyle = tone;
    ctx.lineWidth = farSide ? 18 : 21;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(attachX, attachY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY - 6);
    ctx.stroke();

    ctx.strokeStyle = outline;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(attachX, attachY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY - 6);
    ctx.stroke();

    ctx.fillStyle = tone;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(footX + 5, footY - 3, foreleg ? 17 : 19, 9, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = palette.claw;
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 3; i += 1) {
      const toeX = footX + 10 + i * 5;
      ctx.beginPath();
      ctx.moveTo(toeX, footY - 4);
      ctx.lineTo(toeX + 4, footY - 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function wombatburrowbuilderDrawWombat(ctx, palette, emerge, sniff, blink) {
    if (emerge <= 0) return;

    const travel = wombatburrowbuilderEaseInOutCubic(emerge);
    const centerX = wombatburrowbuilderLerp(-136, 110, travel);
    const walkPhase = travel * 2.0;
    const activity = wombatburrowbuilderSmoothstep(0.03, 0.18, emerge)
      * (1 - wombatburrowbuilderSmoothstep(0.82, 1, emerge));
    const bodyBob = Math.sin(walkPhase * Math.PI * 2) * 2.8 * activity;
    const bodyPitch = Math.sin(walkPhase * Math.PI * 2 + 0.8) * 0.025 * activity;
    const headDip = 5 * sniff + Math.sin(walkPhase * Math.PI * 2 + 1.6) * 1.8 * activity;

    const farFore = wombatburrowbuilderComputeLegPose(walkPhase, 0.50, activity, 44);
    const farHind = wombatburrowbuilderComputeLegPose(walkPhase, 0.25, activity, -45);
    const nearFore = wombatburrowbuilderComputeLegPose(walkPhase, 0.00, activity, 49);
    const nearHind = wombatburrowbuilderComputeLegPose(walkPhase, 0.75, activity, -49);

    ctx.save();
    ctx.translate(centerX, bodyBob);
    ctx.rotate(bodyPitch);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Ground contact shadow stays broad and low throughout the walk.
    const shadowGradient = ctx.createRadialGradient(2, -1, 5, 2, -1, 86);
    shadowGradient.addColorStop(0, 'rgba(53, 43, 37, .24)');
    shadowGradient.addColorStop(1, 'rgba(53, 43, 37, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.ellipse(2, 0, 91, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Far-side limbs move first so the torso correctly overlaps them.
    wombatburrowbuilderDrawLeg(ctx, palette, 37, -34, farFore.x, farFore.y, true, true);
    wombatburrowbuilderDrawLeg(ctx, palette, -37, -31, farHind.x, farHind.y, true, false);

    // A very small tail remains close to the rump.
    ctx.fillStyle = palette.furDark;
    ctx.strokeStyle = palette.furDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(-82, -43, 12, 8, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Long, level torso: the pelvis never drops into a seated posture.
    const bodyGradient = ctx.createLinearGradient(-70, -96, 46, -8);
    bodyGradient.addColorStop(0, palette.furLight);
    bodyGradient.addColorStop(0.42, palette.fur);
    bodyGradient.addColorStop(1, palette.furDark);
    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = palette.furDark;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-78, -51);
    ctx.bezierCurveTo(-69, -87, -31, -102, 17, -91);
    ctx.bezierCurveTo(50, -84, 68, -63, 67, -38);
    ctx.bezierCurveTo(55, -15, 14, -7, -31, -13);
    ctx.bezierCurveTo(-65, -18, -83, -30, -78, -51);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle fur direction breaks up the large body without visual clutter.
    ctx.strokeStyle = 'rgba(63, 53, 47, .25)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 7; i += 1) {
      const fx = -57 + i * 17;
      ctx.beginPath();
      ctx.moveTo(fx, -69 + (i % 2) * 4);
      ctx.quadraticCurveTo(fx + 8, -64, fx + 14, -57 + (i % 3) * 3);
      ctx.stroke();
    }

    // Near-side limbs remain short, sturdy, and under the body.
    wombatburrowbuilderDrawLeg(ctx, palette, -43, -30, nearHind.x, nearHind.y, false, false);
    wombatburrowbuilderDrawLeg(ctx, palette, 43, -33, nearFore.x, nearFore.y, false, true);

    // Short neck and low head align the muzzle close to the ground.
    ctx.save();
    ctx.translate(63, -47 + headDip);
    ctx.rotate(0.10 + 0.03 * sniff);

    const headGradient = ctx.createLinearGradient(-16, -45, 55, 28);
    headGradient.addColorStop(0, palette.furLight);
    headGradient.addColorStop(0.55, palette.fur);
    headGradient.addColorStop(1, palette.furDark);
    ctx.fillStyle = headGradient;
    ctx.strokeStyle = palette.furDark;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, -20);
    ctx.bezierCurveTo(-4, -42, 29, -42, 48, -22);
    ctx.bezierCurveTo(63, -8, 61, 14, 42, 25);
    ctx.bezierCurveTo(17, 38, -10, 23, -23, 4);
    ctx.bezierCurveTo(-29, -5, -27, -14, -20, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Small rounded ears sit low on the head rather than on top of a long neck.
    for (const ear of [{ x: -4, y: -31, r: -0.16 }, { x: 27, y: -31, r: 0.18 }]) {
      ctx.save();
      ctx.translate(ear.x, ear.y);
      ctx.rotate(ear.r);
      ctx.fillStyle = palette.furDark;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.muzzle;
      ctx.beginPath();
      ctx.ellipse(0, 1, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Broad muzzle, nostrils, and whiskers keep the head recognizably wombat-like.
    ctx.fillStyle = palette.muzzle;
    ctx.beginPath();
    ctx.ellipse(48, 11, 29, 20, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.nose;
    ctx.beginPath();
    ctx.ellipse(70, 8, 11, 8, 0.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.nose;
    ctx.beginPath();
    ctx.ellipse(24, -7, 4.5, blink > 0.58 ? 1.1 : 4.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(60, 49, 43, .65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(56, 13); ctx.lineTo(85, 8);
    ctx.moveTo(56, 17); ctx.lineTo(84, 18);
    ctx.moveTo(54, 21); ctx.lineTo(79, 28);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  function wombatburrowbuilderDrawAnimation(
    ctx, x, y, scale, elapsed, duration, variant = 0
  ) {
    const progress = wombatburrowbuilderClamp(elapsed / duration, 0, 1);
    const variantIndex = Math.abs(Math.floor(variant)) % WOMBATBURROWBUILDER_PALETTES.length;
    const palette = WOMBATBURROWBUILDER_PALETTES[variantIndex];
    const direction = variantIndex === 1 ? -1 : 1;

    // Phase 1: a fixed burrow mound and dark entrance form; no loose soil pieces appear.
    const moundGrowth = wombatburrowbuilderEaseOutCubic(
      wombatburrowbuilderSmoothstep(0, 0.17, progress)
    );
    const opening = wombatburrowbuilderEaseOutCubic(
      wombatburrowbuilderSmoothstep(0.07, 0.20, progress)
    );

    // Phase 2: the wombat emerges through the opening with a slow four-beat walk.
    const emerge = wombatburrowbuilderEaseInOutCubic(
      wombatburrowbuilderSmoothstep(0.20, 0.84, progress)
    );

    // Phase 3: one low head dip and one blink, then a still quadrupedal final pose.
    const sniff = wombatburrowbuilderWindow(progress, 0.84, 0.94);
    const blink = wombatburrowbuilderWindow(progress, 0.90, 0.95);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * direction, scale);

    wombatburrowbuilderDrawMoundBack(ctx, palette, moundGrowth, opening);

    // Inside copy: only portions physically visible through the tunnel opening are drawn.
    ctx.save();
    ctx.beginPath();
    wombatburrowbuilderOpeningPath(ctx);
    ctx.clip();
    wombatburrowbuilderDrawWombat(ctx, palette, emerge, sniff, blink);
    ctx.restore();

    // The earthen rim sits between the inside and outside portions of the animal.
    wombatburrowbuilderDrawMoundForeground(ctx, palette, moundGrowth, opening);

    // Outside copy: redraw the animal fully opaque over the right-hand burrow wall.
    // The clip plane widens gradually as the shoulders and torso clear the mouth,
    // preventing the foreground earth from showing through the animal's silhouette.
    const outsideClipX = wombatburrowbuilderLerp(18, -10,
      wombatburrowbuilderSmoothstep(0.12, 0.58, emerge));
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.rect(outsideClipX, -220, 290, 240);
    ctx.clip();
    wombatburrowbuilderDrawWombat(ctx, palette, emerge, sniff, blink);
    ctx.restore();

    ctx.restore();
  }

  function wombatburrowbuilderDrawPin(pin, current) {
    const elapsed = Math.min(current - pin.rocket.startedAt, WOMBATBURROWBUILDER_DURATION_MS);
    const naturalScale = Math.min(view.w / 520, view.h / 520);
    const variantIndex = Math.abs(Math.floor(pin.rocket.variant || 0)) % WOMBATBURROWBUILDER_PALETTES.length;
    const intendedAnchorY = pin.y + layout.pinH * 0.58;
    const placement = fitSpecialAnimationPlacement({
      preferredX: pin.x,
      preferredY: intendedAnchorY,
      naturalScale,
      bounds: WOMBATBURROWBUILDER_PLACEMENT.bounds,
      policy: WOMBATBURROWBUILDER_PLACEMENT.policy,
      safeArea: { left: 0, top: 0, right: view.w, bottom: view.h },
      margin: WOMBATBURROWBUILDER_PLACEMENT.margin,
      mirrorX: WOMBATBURROWBUILDER_PLACEMENT.mirroredVariants.includes(variantIndex)
    });
    wombatburrowbuilderLastPlacement = placement;
    wombatburrowbuilderDrawAnimation(
      ctx,
      placement.resolvedX,
      placement.resolvedY,
      placement.resolvedScale,
      elapsed,
      WOMBATBURROWBUILDER_DURATION_MS,
      pin.rocket.variant
    );
  }


  // =====================================================
  // BABY STEGOSAURUS HATCH v2 SPECIAL ANIMATION
  // Source: babystegosaurushatch-integration-v2.js
  // =====================================================
  const BABYSTEGOSAURUSHATCH_DURATION_MS = 5200;

  const BABYSTEGOSAURUSHATCH_PALETTES = [
    { shell: '#d7c89f', shellShade: '#9c8759', crack: '#5e5138', speckle: '#8f7044', body: '#78a96f', bodyShade: '#4f7e55', belly: '#a9c88d', plate: '#e7a451', plateShade: '#bd6e3c', eye: '#292923' },
    { shell: '#dfc9b7', shellShade: '#ae856e', crack: '#684d40', speckle: '#9d6f58', body: '#9b8bb7', bodyShade: '#6d6089', belly: '#c7b8d2', plate: '#e2b55f', plateShade: '#b9813f', eye: '#2b2730' }
  ];

  function babystegosaurushatchClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function babystegosaurushatchLerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function babystegosaurushatchEaseOutCubic(value) {
    const t = 1 - babystegosaurushatchClamp(value, 0, 1);
    return 1 - t * t * t;
  }

  function babystegosaurushatchEaseInOutCubic(value) {
    const t = babystegosaurushatchClamp(value, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function babystegosaurushatchSmoothstep(edge0, edge1, value) {
    const t = babystegosaurushatchClamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function babystegosaurushatchWindow(value, start, end) {
    const t = babystegosaurushatchClamp((value - start) / (end - start), 0, 1);
    return Math.sin(t * Math.PI);
  }

  function babystegosaurushatchDrawCrack(ctx, x, y, scale, progress, color, mirror) {
    if (progress <= 0) return;
    const points = [[0, 0], [11, 14], [2, 31], [18, 47], [8, 65]];
    const visibleSegments = progress * (points.length - 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * mirror, scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < points.length - 1; i += 1) {
      const segmentAmount = babystegosaurushatchClamp(visibleSegments - i, 0, 1);
      if (segmentAmount <= 0) break;
      ctx.lineTo(
        babystegosaurushatchLerp(points[i][0], points[i + 1][0], segmentAmount),
        babystegosaurushatchLerp(points[i][1], points[i + 1][1], segmentAmount)
      );
    }
    ctx.stroke();
    ctx.restore();
  }

  function babystegosaurushatchDrawEgg(ctx, x, y, scale, palette, crackProgress, variant) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const shellGradient = ctx.createLinearGradient(-78, -218, 82, 22);
    shellGradient.addColorStop(0, '#fff8e8');
    shellGradient.addColorStop(0.4, palette.shell);
    shellGradient.addColorStop(1, palette.shellShade);
    ctx.fillStyle = shellGradient;
    ctx.strokeStyle = palette.shellShade;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -220);
    ctx.bezierCurveTo(82, -192, 112, -84, 91, -18);
    ctx.bezierCurveTo(70, 41, -70, 41, -91, -18);
    ctx.bezierCurveTo(-112, -84, -82, -192, 0, -220);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-34, -137, 20, 55, -0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = palette.speckle;
    const marks = variant % 2 === 0
      ? [[-48, -91, 7, 4], [35, -128, 5, 7], [51, -56, 6, 4], [-19, -170, 5, 4], [-57, -37, 5, 6]]
      : [[-50, -126, 5, 7], [23, -176, 6, 4], [55, -90, 7, 5], [-24, -61, 5, 4], [24, -33, 6, 5]];
    for (const mark of marks) {
      ctx.beginPath();
      ctx.ellipse(mark[0], mark[1], mark[2], mark[3], 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    babystegosaurushatchDrawCrack(ctx, -9, -139, 1.02, crackProgress, palette.crack, 1);
    babystegosaurushatchDrawCrack(ctx, 35, -94, 0.76, babystegosaurushatchClamp((crackProgress - 0.3) / 0.7, 0, 1), palette.crack, -1);
    babystegosaurushatchDrawCrack(ctx, -49, -68, 0.62, babystegosaurushatchClamp((crackProgress - 0.64) / 0.36, 0, 1), palette.crack, 1);
    ctx.restore();
  }

  function babystegosaurushatchDrawShellHalf(ctx, x, y, scale, rotation, side, palette, variant) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale * side, scale);
    const gradient = ctx.createLinearGradient(-90, -85, 62, 54);
    gradient.addColorStop(0, '#fff8e5');
    gradient.addColorStop(0.54, palette.shell);
    gradient.addColorStop(1, palette.shellShade);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = palette.shellShade;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -112);
    ctx.bezierCurveTo(34, -96, 73, -59, 88, -10);
    ctx.bezierCurveTo(102, 34, 65, 68, 9, 67);
    ctx.lineTo(-11, 51);
    ctx.lineTo(8, 30);
    ctx.lineTo(-10, 9);
    ctx.lineTo(9, -13);
    ctx.lineTo(-9, -34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.48;
    ctx.fillStyle = palette.speckle;
    ctx.beginPath();
    ctx.ellipse(variant % 2 === 0 ? 39 : 52, -30, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function babystegosaurushatchDrawPlate(ctx, x, y, width, height, rotation, growth, palette) {
    if (growth <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(growth, growth);
    const gradient = ctx.createLinearGradient(0, -height, 0, 0);
    gradient.addColorStop(0, palette.plate);
    gradient.addColorStop(1, palette.plateShade);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = palette.plateShade;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-width * 0.5, 0);
    ctx.quadraticCurveTo(-width * 0.25, -height * 0.72, 0, -height);
    ctx.quadraticCurveTo(width * 0.32, -height * 0.64, width * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function babystegosaurushatchDrawStegosaurus(ctx, x, groundY, scale, direction, palette, reveal, plateGrowth, tailSway, headLift, blink) {
    if (reveal <= 0) return;
    ctx.save();
    ctx.translate(x, groundY);
    ctx.scale(scale * direction, scale);
    ctx.globalAlpha = reveal;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.save();
    ctx.translate(-92, -82);
    ctx.rotate(-0.05 + tailSway);
    const tailGradient = ctx.createLinearGradient(-98, -10, 10, 12);
    tailGradient.addColorStop(0, palette.bodyShade);
    tailGradient.addColorStop(1, palette.body);
    ctx.fillStyle = tailGradient;
    ctx.strokeStyle = palette.bodyShade;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(4, -25);
    ctx.quadraticCurveTo(-70, -35, -165, -10);
    ctx.quadraticCurveTo(-83, 9, 9, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const plateData = [
      [-77, -120, 28, 45, -0.18], [-50, -133, 34, 59, -0.12], [-17, -139, 39, 68, -0.03],
      [20, -136, 37, 62, 0.07], [53, -122, 31, 49, 0.15]
    ];
    for (let i = 0; i < plateData.length; i += 1) {
      const localGrowth = babystegosaurushatchClamp(plateGrowth * 1.28 - i * 0.07, 0, 1);
      const plate = plateData[i];
      babystegosaurushatchDrawPlate(ctx, plate[0], plate[1], plate[2], plate[3], plate[4], localGrowth, palette);
    }

    const bodyGradient = ctx.createLinearGradient(-90, -142, 91, -38);
    bodyGradient.addColorStop(0, palette.belly);
    bodyGradient.addColorStop(0.34, palette.body);
    bodyGradient.addColorStop(1, palette.bodyShade);
    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = palette.bodyShade;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(-5, -82, 101, 58, -0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const legPositions = [-59, -23, 25, 59];
    for (let i = 0; i < legPositions.length; i += 1) {
      const legX = legPositions[i];
      const isBack = i === 0 || i === 2;
      ctx.fillStyle = isBack ? palette.bodyShade : palette.body;
      ctx.strokeStyle = palette.bodyShade;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(legX - 14, -62, 29, 57, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = palette.belly;
      ctx.beginPath();
      ctx.ellipse(legX + 3, -4, 19, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(70, -91 - headLift * 8);
    ctx.rotate(-0.06 - headLift * 0.08);
    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = palette.bodyShade;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(22, 3, 48, 35, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, -9);
    ctx.quadraticCurveTo(-35, 10, -40, 36);
    ctx.lineTo(7, 38);
    ctx.quadraticCurveTo(18, 22, 26, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.eye;
    ctx.beginPath();
    ctx.ellipse(43, -3, 5.5, Math.max(0.8, 6 * (1 - blink)), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = reveal * 0.75;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(45, -5, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = reveal;
    ctx.strokeStyle = palette.bodyShade;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(56, 12);
    ctx.quadraticCurveTo(47, 17, 38, 13);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = palette.plate;
    ctx.strokeStyle = palette.plateShade;
    ctx.lineWidth = 3;
    for (const spike of [[-157, -94, -175, -105], [-151, -77, -171, -70]]) {
      ctx.beginPath();
      ctx.moveTo(spike[0], spike[1] - 5);
      ctx.lineTo(spike[2], spike[3]);
      ctx.lineTo(spike[0], spike[1] + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function babystegosaurushatchDrawAnimation(ctx, x, y, scale, elapsed, duration, variant = 0) {
    const progress = babystegosaurushatchClamp(elapsed / duration, 0, 1);
    const variantIndex = Math.abs(Math.floor(variant)) % BABYSTEGOSAURUSHATCH_PALETTES.length;
    const palette = BABYSTEGOSAURUSHATCH_PALETTES[variantIndex];
    const direction = 1;

    // Phase 1: the large speckled egg rises into place.
    const rise = babystegosaurushatchEaseOutCubic(babystegosaurushatchClamp(progress / 0.19, 0, 1));
    const eggY = babystegosaurushatchLerp(y + 92 * scale, y, rise);
    const eggScale = babystegosaurushatchLerp(0.70, 1, rise) * scale;

    // Phase 2: three cracks form in sequence.
    const crackProgress = babystegosaurushatchSmoothstep(0.17, 0.48, progress);

    // Phase 3: the shell halves open and settle around the hatchling.
    const open = babystegosaurushatchEaseInOutCubic(babystegosaurushatchSmoothstep(0.45, 0.71, progress));
    const fullEggAlpha = 1 - babystegosaurushatchSmoothstep(0.53, 0.64, progress);
    const halfAlpha = babystegosaurushatchSmoothstep(0.51, 0.62, progress);

    // Phase 4: the hatchling rises, its plates unfold, its tail sways once, and its head lifts before settling.
    const hatchlingReveal = babystegosaurushatchEaseOutCubic(babystegosaurushatchSmoothstep(0.55, 0.85, progress));
    const plateGrowth = babystegosaurushatchEaseOutCubic(babystegosaurushatchSmoothstep(0.62, 0.90, progress));
    const tailSway = 0.18 * babystegosaurushatchWindow(progress, 0.69, 0.91);
    const headLift = babystegosaurushatchWindow(progress, 0.73, 0.92);
    const blink = babystegosaurushatchWindow(progress, 0.89, 0.95);
    const hatchlingGroundY = babystegosaurushatchLerp(y + 64 * scale, y, hatchlingReveal);
    const hatchlingScale = babystegosaurushatchLerp(0.64, 0.94, hatchlingReveal) * scale;

    ctx.save();
    ctx.globalAlpha = 0.19 + rise * 0.08;
    ctx.fillStyle = '#504a40';
    ctx.beginPath();
    ctx.ellipse(x, y + 6 * scale, 147 * scale, 20 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = fullEggAlpha;
    babystegosaurushatchDrawEgg(ctx, x, eggY, eggScale, palette, crackProgress, variantIndex);

    babystegosaurushatchDrawStegosaurus(
      ctx,
      x,
      hatchlingGroundY,
      hatchlingScale,
      direction,
      palette,
      hatchlingReveal,
      plateGrowth,
      direction * tailSway,
      headLift,
      blink
    );

    ctx.globalAlpha = halfAlpha;
    const halfScale = babystegosaurushatchLerp(0.98, 0.80, open) * scale;
    const halfRise = babystegosaurushatchLerp(-46, 0, open) * scale;
    const halfY = y - 66 * halfScale + halfRise;
    babystegosaurushatchDrawShellHalf(ctx, x - babystegosaurushatchLerp(22, 135, open) * scale, halfY, halfScale, -direction * babystegosaurushatchLerp(0.08, 0.22, open), -1, palette, variantIndex);
    babystegosaurushatchDrawShellHalf(ctx, x + babystegosaurushatchLerp(22, 135, open) * scale, halfY, halfScale, direction * babystegosaurushatchLerp(0.08, 0.22, open), 1, palette, variantIndex);
    ctx.restore();
  }

  function babystegosaurushatchDrawPin(pin, current) {
    const elapsed = Math.min(current - pin.rocket.startedAt, BABYSTEGOSAURUSHATCH_DURATION_MS);
    const naturalScale = Math.min(view.w / 560, view.h / 720);
    const maxScaleX = (view.w - 16) / 490;
    const maxScaleY = (view.h - 16) / 335;
    const scale = Math.min(naturalScale, maxScaleX, maxScaleY);
    const leftExtent = 245 * scale;
    const rightExtent = 245 * scale;
    const topExtent = 223 * scale;
    const bottomExtent = 112 * scale;
    const anchorX = clamp(pin.x, leftExtent + 8, view.w - rightExtent - 8);
    const intendedAnchorY = pin.y + layout.pinH * 0.58;
    const anchorY = clamp(intendedAnchorY, topExtent + 8, view.h - bottomExtent - 8);
    babystegosaurushatchDrawAnimation(
      ctx,
      anchorX,
      anchorY,
      scale,
      elapsed,
      BABYSTEGOSAURUSHATCH_DURATION_MS,
      pin.rocket.variant
    );
  }





  // =====================================================
  // APPROVED YELLOW CHICK HATCH V4 ANIMATION DRAWING
  // Source: yellowchickhatch-integration-v4.js
  // =====================================================
const YELLOWCHICKHATCH_DURATION_MS = 5200;

const YELLOWCHICKHATCH_PALETTES = [
  {
    shell: '#e7d09a', shellLight: '#fff6d9', shellShade: '#ae8d53', shellInner: '#fff0bf',
    crack: '#5e4a2d', speckle: '#a47a3f', chick: '#f4cf45', chickMid: '#f7df72',
    chickLight: '#fff6b9', chickShade: '#cf9c25', featherShadow: '#bd841d', outline: '#9d701f',
    beak: '#ed8b27', beakLight: '#ffb14b', beakShade: '#b95a19', leg: '#bb681d', eye: '#26231f', cheek: '#f4b84e'
  },
  {
    shell: '#d9e1d1', shellLight: '#f8fff0', shellShade: '#879f7e', shellInner: '#f3f1cf',
    crack: '#43543f', speckle: '#6f8a67', chick: '#f6d756', chickMid: '#f9e789',
    chickLight: '#fff9c9', chickShade: '#cfa42b', featherShadow: '#b98822', outline: '#947222',
    beak: '#df7c25', beakLight: '#ffa64a', beakShade: '#a95319', leg: '#a85d20', eye: '#26231f', cheek: '#efb950'
  },
  {
    shell: '#e4cbd8', shellLight: '#fff3f7', shellShade: '#a87991', shellInner: '#fff0d3',
    crack: '#624655', speckle: '#94657b', chick: '#f2cb3d', chickMid: '#f9df72',
    chickLight: '#fff5b0', chickShade: '#c68f1e', featherShadow: '#ae7418', outline: '#8f651c',
    beak: '#f08c2f', beakLight: '#ffb25d', beakShade: '#b85b1e', leg: '#b76624', eye: '#26231f', cheek: '#f2ad45'
  }
];

const YELLOWCHICKHATCH_SPECKLES = [
  [[-48,-130,5,3,-0.2],[-16,-165,4,3,0.3],[31,-142,6,4,-0.4],[53,-102,4,3,0.2],[-55,-79,5,3,0.1],[21,-66,4,3,-0.2],[-34,-35,6,4,0.3],[49,-29,4,3,-0.3]],
  [[-43,-150,5,3,0.1],[8,-174,4,3,-0.4],[47,-126,6,4,0.2],[-57,-103,4,3,-0.2],[24,-91,5,3,0.3],[-30,-65,4,3,-0.1],[53,-48,5,3,0.2],[-7,-25,4,3,-0.3]],
  [[-50,-138,4,3,-0.2],[-5,-173,5,3,0.2],[39,-151,4,3,0.3],[58,-91,5,3,-0.1],[-51,-70,6,4,0.2],[13,-74,4,3,-0.4],[-30,-32,4,3,0.2],[44,-34,6,4,-0.2]]
];

function yellowchickhatchClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function yellowchickhatchLerp(a, b, amount) {
  return a + (b - a) * amount;
}

function yellowchickhatchEaseOutCubic(value) {
  const t = 1 - yellowchickhatchClamp(value, 0, 1);
  return 1 - t * t * t;
}

function yellowchickhatchEaseInOutCubic(value) {
  const t = yellowchickhatchClamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function yellowchickhatchSmoothstep(edge0, edge1, value) {
  const t = yellowchickhatchClamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function yellowchickhatchWindow(value, start, end) {
  if (value <= start || value >= end) return 0;
  return Math.sin(((value - start) / (end - start)) * Math.PI);
}

function yellowchickhatchDamped(value, frequency, decay) {
  const t = yellowchickhatchClamp(value, 0, 1);
  return Math.sin(t * Math.PI * frequency) * Math.exp(-decay * t) * (1 - t);
}

function yellowchickhatchDrawTaperedFeather(ctx, x, y, length, width, rotation, curve, fill, edge, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = fill;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.35;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-length * 0.48, 0);
  ctx.bezierCurveTo(-length * 0.22, -width * 0.72, length * 0.14, -width * 0.58 + curve, length * 0.50, 0);
  ctx.bezierCurveTo(length * 0.12, width * 0.64 + curve, -length * 0.22, width * 0.62, -length * 0.48, 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha *= 0.24;
  ctx.stroke();
  ctx.restore();
}

function yellowchickhatchDrawWisp(ctx, x, y, length, rotation, curl, color, width, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.28, curl, length * 0.70, -curl * 0.36, length, 0);
  ctx.stroke();
  ctx.restore();
}

function yellowchickhatchDrawCrackPath(ctx, progress, palette) {
  if (progress <= 0) return;
  const main = [[2,-182],[-7,-164],[6,-148],[-9,-126],[4,-109],[-13,-89],[-1,-68],[ -16,-48],[-7,-26]];
  const visible = progress * (main.length - 1);
  ctx.save();
  ctx.strokeStyle = palette.crack;
  ctx.lineWidth = 4.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(main[0][0], main[0][1]);
  for (let i = 0; i < main.length - 1; i += 1) {
    const amount = yellowchickhatchClamp(visible - i, 0, 1);
    if (amount <= 0) break;
    ctx.lineTo(
      yellowchickhatchLerp(main[i][0], main[i + 1][0], amount),
      yellowchickhatchLerp(main[i][1], main[i + 1][1], amount)
    );
  }
  ctx.stroke();

  const branchA = yellowchickhatchClamp((progress - 0.34) / 0.66, 0, 1);
  if (branchA > 0) {
    ctx.beginPath();
    ctx.moveTo(-8, -126);
    ctx.lineTo(yellowchickhatchLerp(-8, -34, branchA), yellowchickhatchLerp(-126, -137, branchA));
    if (branchA > 0.58) ctx.lineTo(yellowchickhatchLerp(-34, -48, (branchA - 0.58) / 0.42), yellowchickhatchLerp(-137, -124, (branchA - 0.58) / 0.42));
    ctx.stroke();
  }
  const branchB = yellowchickhatchClamp((progress - 0.57) / 0.43, 0, 1);
  if (branchB > 0) {
    ctx.beginPath();
    ctx.moveTo(-1, -69);
    ctx.lineTo(yellowchickhatchLerp(-1, 24, branchB), yellowchickhatchLerp(-69, -81, branchB));
    if (branchB > 0.48) ctx.lineTo(yellowchickhatchLerp(24, 37, (branchB - 0.48) / 0.52), yellowchickhatchLerp(-81, -67, (branchB - 0.48) / 0.52));
    ctx.stroke();
  }
  ctx.restore();
}

function yellowchickhatchDrawEgg(ctx, x, y, scale, palette, crackProgress, variant) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';

  const shellGradient = ctx.createRadialGradient(-32, -145, 18, 5, -91, 124);
  shellGradient.addColorStop(0, palette.shellLight);
  shellGradient.addColorStop(0.38, palette.shell);
  shellGradient.addColorStop(0.78, palette.shell);
  shellGradient.addColorStop(1, palette.shellShade);
  ctx.fillStyle = shellGradient;
  ctx.strokeStyle = palette.shellShade;
  ctx.lineWidth = 4.6;
  ctx.beginPath();
  ctx.moveTo(0, -210);
  ctx.bezierCurveTo(72, -194, 99, -97, 87, -34);
  ctx.bezierCurveTo(77, 25, 49, 43, 0, 44);
  ctx.bezierCurveTo(-49, 43, -77, 25, -87, -34);
  ctx.bezierCurveTo(-99, -97, -72, -194, 0, -210);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha *= 0.22;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-34, -128, 19, 61, -0.29, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = palette.speckle;
  ctx.globalAlpha *= 0.55;
  for (const s of YELLOWCHICKHATCH_SPECKLES[variant]) {
    ctx.save();
    ctx.translate(s[0], s[1]);
    ctx.rotate(s[4]);
    ctx.beginPath();
    ctx.ellipse(0, 0, s[2], s[3], 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  yellowchickhatchDrawCrackPath(ctx, crackProgress, palette);

  // Tiny attached chips lift slightly as the crack completes.
  const chip = yellowchickhatchSmoothstep(0.68, 1, crackProgress);
  ctx.save();
  ctx.globalAlpha *= chip;
  ctx.translate(-31, -132 - chip * 3);
  ctx.rotate(-0.18 - chip * 0.08);
  ctx.fillStyle = palette.shellLight;
  ctx.strokeStyle = palette.shellShade;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0,0); ctx.lineTo(-12,-4); ctx.lineTo(-7,9); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= chip;
  ctx.translate(24, -78 - chip * 2);
  ctx.rotate(0.24 + chip * 0.07);
  ctx.fillStyle = palette.shell;
  ctx.strokeStyle = palette.shellShade;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0,0); ctx.lineTo(12,-7); ctx.lineTo(8,9); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function yellowchickhatchShellHalfPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-7, -112);
  ctx.lineTo(9, -95);
  ctx.lineTo(-5, -75);
  ctx.lineTo(13, -57);
  ctx.lineTo(-1, -36);
  ctx.lineTo(18, -17);
  ctx.lineTo(3, 3);
  ctx.lineTo(19, 21);
  ctx.bezierCurveTo(31, 57, 71, 64, 94, 31);
  ctx.bezierCurveTo(116, -3, 103, -68, 68, -104);
  ctx.bezierCurveTo(40, -133, 10, -139, -7, -112);
  ctx.closePath();
}

function yellowchickhatchDrawShellHalf(ctx, x, y, scale, rotation, side, palette, variant) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale * side, scale);
  ctx.lineJoin = 'round';

  // Inner surface sits beneath the outer shell and makes the rim visibly thick.
  ctx.save();
  ctx.translate(-5, 2);
  ctx.fillStyle = palette.shellInner;
  ctx.strokeStyle = palette.shellShade;
  ctx.lineWidth = 5.5;
  yellowchickhatchShellHalfPath(ctx);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const shellGradient = ctx.createLinearGradient(-10, -126, 94, 52);
  shellGradient.addColorStop(0, palette.shellLight);
  shellGradient.addColorStop(0.48, palette.shell);
  shellGradient.addColorStop(1, palette.shellShade);
  ctx.fillStyle = shellGradient;
  ctx.strokeStyle = palette.shellShade;
  ctx.lineWidth = 4.2;
  yellowchickhatchShellHalfPath(ctx);
  ctx.fill();
  ctx.stroke();

  // Narrow cream band along the broken edge suggests shell thickness.
  ctx.strokeStyle = palette.shellInner;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -109);
  ctx.lineTo(11, -95);
  ctx.lineTo(-3, -75);
  ctx.lineTo(15, -57);
  ctx.lineTo(1, -36);
  ctx.lineTo(20, -17);
  ctx.lineTo(5, 3);
  ctx.lineTo(19, 20);
  ctx.stroke();
  ctx.strokeStyle = palette.shellShade;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  ctx.save();
  ctx.fillStyle = palette.speckle;
  ctx.globalAlpha *= 0.48;
  const dots = variant === 1 ? [[48,-69,5,3],[72,-24,4,3],[44,23,5,3]] : [[37,-82,4,3],[75,-44,5,3],[54,19,4,3]];
  for (const d of dots) {
    ctx.beginPath();
    ctx.ellipse(d[0], d[1], d[2], d[3], 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Small attached shards break up the rim without looking decorative.
  ctx.fillStyle = palette.shell;
  ctx.strokeStyle = palette.shellShade;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(7,-95); ctx.lineTo(18,-100); ctx.lineTo(15,-87); ctx.lineTo(5,-83); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1,-36); ctx.lineTo(-8,-43); ctx.lineTo(-5,-29); ctx.lineTo(5,-25); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function yellowchickhatchDrawLeg(ctx, x, y, side, palette, weight) {
  ctx.save();
  ctx.translate(x, y);
  const bend = side * (2.5 + weight * 1.5);
  ctx.strokeStyle = palette.leg;
  ctx.lineWidth = 5.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -27);
  ctx.quadraticCurveTo(bend, -16, side * 1.5, -8);
  ctx.quadraticCurveTo(side * 1.5, -3, side * 3, 0);
  ctx.stroke();

  ctx.lineWidth = 4.3;
  ctx.beginPath();
  ctx.moveTo(side * 3, 0);
  ctx.quadraticCurveTo(side * 11, 2, side * 17, 5);
  ctx.moveTo(side * 3, 0);
  ctx.quadraticCurveTo(side * 2, 5, side * 1, 8);
  ctx.moveTo(side * 3, 0);
  ctx.quadraticCurveTo(-side * 5, 2, -side * 10, 5);
  ctx.stroke();
  ctx.restore();
}

function yellowchickhatchDrawTail(ctx, palette, settle) {
  ctx.save();
  ctx.translate(-54, -72);
  ctx.rotate(-0.25 + settle * 0.04);
  const feathers = [
    [-12,-7,39,15,-0.42,-3,palette.chickMid],
    [-10,4,42,16,-0.12,2,palette.chick],
    [-7,14,34,14,0.18,3,palette.chickShade]
  ];
  for (const f of feathers) {
    yellowchickhatchDrawTaperedFeather(ctx, f[0], f[1], f[2], f[3], f[4], f[5], f[6], palette.outline, 0.96);
  }
  ctx.restore();
}

function yellowchickhatchBodyPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-34, -143);
  ctx.bezierCurveTo(-59, -132, -72, -105, -68, -75);
  ctx.bezierCurveTo(-69, -46, -49, -20, -19, -15);
  ctx.bezierCurveTo(8, -7, 44, -15, 58, -39);
  ctx.bezierCurveTo(71, -62, 64, -101, 46, -124);
  ctx.bezierCurveTo(27, -148, -7, -154, -34, -143);
  ctx.closePath();
}

function yellowchickhatchDrawWing(ctx, side, palette, lift, featherSpread, farWing) {
  ctx.save();
  const baseX = side * (farWing ? 34 : 44);
  const baseY = farWing ? -102 : -94;
  ctx.translate(baseX, baseY);
  ctx.rotate(side * ((farWing ? 0.09 : 0.14) + lift * (farWing ? 0.52 : 0.73)));
  ctx.scale(side, 1);
  ctx.globalAlpha *= farWing ? 0.74 : 1;

  const gradient = ctx.createRadialGradient(-10,-26,4,8,4,58);
  gradient.addColorStop(0, palette.chickLight);
  gradient.addColorStop(0.43, palette.chickMid);
  gradient.addColorStop(1, palette.chickShade);
  ctx.fillStyle = gradient;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-13,-38);
  ctx.bezierCurveTo(12,-43,32,-23,34,1);
  ctx.bezierCurveTo(35,23,22,43,3,50);
  ctx.bezierCurveTo(-15,42,-24,23,-24,2);
  ctx.bezierCurveTo(-24,-17,-21,-32,-13,-38);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha *= 0.45;
  ctx.stroke();
  ctx.globalAlpha /= 0.45;

  // Three large overlapping feather groups form the wing structure.
  const spread = featherSpread;
  yellowchickhatchDrawTaperedFeather(ctx, 1, -7, 38, 14, -0.30 - spread * 0.13, -2, palette.chickLight, palette.featherShadow, 0.82);
  yellowchickhatchDrawTaperedFeather(ctx, 6, 8, 43, 15, -0.05 - spread * 0.10, 2, palette.chickMid, palette.featherShadow, 0.90);
  yellowchickhatchDrawTaperedFeather(ctx, 5, 24, 37, 14, 0.18 + spread * 0.08, 3, palette.chick, palette.featherShadow, 0.92);

  ctx.strokeStyle = palette.chickLight;
  ctx.lineWidth = 2.4;
  ctx.globalAlpha *= 0.62;
  ctx.beginPath();
  ctx.moveTo(-8,-22); ctx.quadraticCurveTo(8,-16,18,-5);
  ctx.moveTo(-8,-8); ctx.quadraticCurveTo(10,-2,21,10);
  ctx.moveTo(-5,8); ctx.quadraticCurveTo(10,14,18,24);
  ctx.stroke();
  ctx.restore();
}

function yellowchickhatchDrawChestLayers(ctx, palette) {
  ctx.save();
  // Soft chest volume separates the breast from the belly.
  const chestGradient = ctx.createRadialGradient(24,-108,5,19,-87,49);
  chestGradient.addColorStop(0, palette.chickLight);
  chestGradient.addColorStop(0.55, palette.chickMid);
  chestGradient.addColorStop(1, 'rgba(244,207,69,0)');
  ctx.save();
  ctx.fillStyle = chestGradient;
  ctx.globalAlpha *= 0.68;
  ctx.beginPath();
  ctx.ellipse(24,-88,34,50,-0.11,0,Math.PI*2);
  ctx.fill();
  ctx.restore();

  const layers = [
    [-8,-116,25,8,-0.30,1,palette.chickLight,0.48],
    [10,-108,29,9,0.14,2,palette.chickMid,0.56],
    [28,-98,24,8,0.34,2,palette.chick,0.46],
    [-14,-91,28,9,-0.18,2,palette.chickMid,0.50],
    [8,-82,31,10,0.07,3,palette.chick,0.56],
    [27,-70,25,8,0.25,2,palette.chickMid,0.46],
    [-7,-61,27,9,-0.12,2,palette.chickMid,0.50],
    [15,-49,29,9,0.14,2,palette.chick,0.50]
  ];
  for (const f of layers) {
    yellowchickhatchDrawTaperedFeather(ctx, f[0], f[1], f[2], f[3], f[4], f[5], f[6], palette.featherShadow, f[7]);
  }
  ctx.restore();
}

function yellowchickhatchDrawCrown(ctx, palette, settle) {
  ctx.save();
  ctx.translate(9, -201);
  ctx.rotate(settle * 0.08);
  yellowchickhatchDrawTaperedFeather(ctx, -18, 5, 37, 11, -1.62 + settle * 0.12, -2, palette.chickMid, palette.outline, 0.94);
  yellowchickhatchDrawTaperedFeather(ctx, -3, -2, 44, 12, -1.39 + settle * 0.07, 2, palette.chickLight, palette.outline, 0.98);
  yellowchickhatchDrawTaperedFeather(ctx, 14, 3, 39, 11, -1.07 - settle * 0.06, 3, palette.chick, palette.outline, 0.94);
  yellowchickhatchDrawTaperedFeather(ctx, 27, 11, 30, 9, -0.78 - settle * 0.05, 2, palette.chickMid, palette.outline, 0.88);
  ctx.restore();
}

function yellowchickhatchHeadPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-35,-175);
  ctx.bezierCurveTo(-29,-202,-2,-217,26,-207);
  ctx.bezierCurveTo(55,-199,71,-173,65,-146);
  ctx.bezierCurveTo(64,-122,47,-104,24,-100);
  ctx.bezierCurveTo(0,-93,-30,-107,-39,-131);
  ctx.bezierCurveTo(-49,-147,-46,-163,-35,-175);
  ctx.closePath();
}

function yellowchickhatchDrawFace(ctx, palette, blink) {
  // Eye socket and upper eyelid.
  ctx.save();
  const faceAlpha = ctx.globalAlpha;
  ctx.fillStyle = 'rgba(120,78,18,0.16)';
  ctx.beginPath();
  ctx.ellipse(37,-160,10,10,0,0,Math.PI*2);
  ctx.fill();

  const eyeHeight = Math.max(0.9, 7.5 * (1 - blink));
  ctx.fillStyle = palette.eye;
  ctx.beginPath();
  ctx.ellipse(39,-160,6.6,eyeHeight,0,0,Math.PI*2);
  ctx.fill();
  if (blink < 0.7) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = faceAlpha * 0.84;
    ctx.beginPath();
    ctx.ellipse(41,-163,2.1,2.5,0,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = faceAlpha;
  }
  ctx.strokeStyle = '#6f541d';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(31,-170); ctx.quadraticCurveTo(39,-175,47,-170);
  ctx.stroke();

  // Warm cheek volume.
  ctx.fillStyle = palette.cheek;
  ctx.globalAlpha = faceAlpha * 0.23;
  ctx.beginPath();
  ctx.ellipse(31,-136,17,11,-0.12,0,Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = faceAlpha;

  // Two-part beak with nostril and mouth seam.
  const upper = ctx.createLinearGradient(57,-153,84,-137);
  upper.addColorStop(0,palette.beakLight);
  upper.addColorStop(1,palette.beak);
  ctx.fillStyle = upper;
  ctx.strokeStyle = palette.beakShade;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(57,-151);
  ctx.quadraticCurveTo(68,-150,77,-142);
  ctx.quadraticCurveTo(69,-138,57,-138);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = palette.beak;
  ctx.beginPath();
  ctx.moveTo(57,-138);
  ctx.quadraticCurveTo(67,-138,75,-134);
  ctx.quadraticCurveTo(67,-128,57,-131);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = palette.beakShade;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(58,-138); ctx.quadraticCurveTo(67,-137,74,-134); ctx.stroke();
  ctx.fillStyle = palette.beakShade;
  ctx.beginPath(); ctx.ellipse(64,-146,1.6,1.1,-0.2,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function yellowchickhatchDrawChick(ctx, x, groundY, scale, direction, palette, reveal, wingLift, featherSpread, blink, settle, bodyCompression, breathing, weightShift) {
  if (reveal <= 0) return;
  ctx.save();
  ctx.translate(x + weightShift * scale * direction, groundY);
  ctx.scale(scale * direction, scale);
  ctx.globalAlpha *= reveal;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Ground contact shadows are tied to each foot and body weight.
  ctx.fillStyle = 'rgba(70,58,39,0.17)';
  ctx.beginPath();
  ctx.ellipse(-23,4,25,6,-0.03,0,Math.PI*2);
  ctx.ellipse(25,4,27,6,0.04,0,Math.PI*2);
  ctx.fill();

  yellowchickhatchDrawLeg(ctx, -22, -1, -1, palette, -weightShift * 0.1);
  yellowchickhatchDrawLeg(ctx, 22, -1, 1, palette, weightShift * 0.1);
  yellowchickhatchDrawTail(ctx, palette, settle);
  yellowchickhatchDrawWing(ctx, -1, palette, wingLift * 0.84, featherSpread * 0.75, true);

  ctx.save();
  const bodyScaleY = 1 - bodyCompression * 0.045 + breathing * 0.012;
  const bodyScaleX = 1 + bodyCompression * 0.025 - breathing * 0.005;
  ctx.scale(bodyScaleX, bodyScaleY);

  const bodyGradient = ctx.createRadialGradient(-27,-122,8,3,-80,95);
  bodyGradient.addColorStop(0,palette.chickLight);
  bodyGradient.addColorStop(0.29,palette.chickMid);
  bodyGradient.addColorStop(0.67,palette.chick);
  bodyGradient.addColorStop(1,palette.chickShade);
  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 2.4;
  ctx.shadowColor = 'rgba(190,132,22,0.18)';
  ctx.shadowBlur = 12;
  yellowchickhatchBodyPath(ctx);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha *= 0.48;
  ctx.stroke();
  ctx.globalAlpha /= 0.48;

  // Ambient occlusion beneath the neck and near wing roots.
  ctx.fillStyle = 'rgba(127,82,16,0.12)';
  ctx.beginPath();
  ctx.ellipse(12,-128,35,11,-0.06,0,Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(39,-91,17,38,-0.13,0,Math.PI*2);
  ctx.fill();

  // Broad warm highlight gives the down a soft volume.
  const bodyLight = ctx.createRadialGradient(-26,-103,3,-26,-103,52);
  bodyLight.addColorStop(0,'rgba(255,255,231,0.54)');
  bodyLight.addColorStop(1,'rgba(255,255,231,0)');
  ctx.fillStyle = bodyLight;
  ctx.beginPath(); ctx.ellipse(-24,-99,38,53,-0.25,0,Math.PI*2); ctx.fill();

  yellowchickhatchDrawChestLayers(ctx, palette);

  // Sparse contour wisps, each with a different direction and length.
  yellowchickhatchDrawWisp(ctx,-52,-127,9,-2.73,-2,palette.chickMid,1.8,0.42);
  yellowchickhatchDrawWisp(ctx,-67,-91,8,-3.04,1,palette.chickMid,1.7,0.36);
  yellowchickhatchDrawWisp(ctx,-62,-49,9,2.79,-1,palette.chickMid,1.8,0.38);
  yellowchickhatchDrawWisp(ctx,-28,-18,8,2.05,1,palette.chickMid,1.7,0.34);
  yellowchickhatchDrawWisp(ctx,31,-18,8,1.10,-1,palette.chickLight,1.8,0.40);
  yellowchickhatchDrawWisp(ctx,58,-47,9,0.34,2,palette.chickMid,1.7,0.36);
  ctx.restore();

  yellowchickhatchDrawWing(ctx, 1, palette, wingLift, featherSpread, false);

  // Crown and head move slightly after the body, producing a soft secondary settle.
  ctx.save();
  const headBob = settle * 3.8 - breathing * 1.2;
  ctx.translate(0, headBob);
  yellowchickhatchDrawCrown(ctx, palette, settle);

  const headGradient = ctx.createRadialGradient(-17,-184,6,10,-154,70);
  headGradient.addColorStop(0,palette.chickLight);
  headGradient.addColorStop(0.34,palette.chickMid);
  headGradient.addColorStop(0.74,palette.chick);
  headGradient.addColorStop(1,palette.chickShade);
  ctx.fillStyle = headGradient;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 2.3;
  ctx.shadowColor = 'rgba(190,132,22,0.17)';
  ctx.shadowBlur = 11;
  yellowchickhatchHeadPath(ctx);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha *= 0.48;
  ctx.stroke();
  ctx.globalAlpha /= 0.48;

  const headLight = ctx.createRadialGradient(-22,-179,3,-22,-179,44);
  headLight.addColorStop(0,'rgba(255,255,236,0.62)');
  headLight.addColorStop(1,'rgba(255,255,236,0)');
  ctx.fillStyle = headLight;
  ctx.beginPath(); ctx.ellipse(-20,-176,34,31,-0.2,0,Math.PI*2); ctx.fill();

  // Cheek, jaw and crown feathers overlap organically.
  yellowchickhatchDrawTaperedFeather(ctx,-29,-157,23,8,-2.72,-1,palette.chickMid,palette.featherShadow,0.48);
  yellowchickhatchDrawTaperedFeather(ctx,-33,-139,21,7,2.78,1,palette.chick,palette.featherShadow,0.46);
  yellowchickhatchDrawTaperedFeather(ctx,-22,-120,20,7,2.30,1,palette.chickMid,palette.featherShadow,0.42);
  yellowchickhatchDrawTaperedFeather(ctx,2,-111,22,7,1.62,1,palette.chick,palette.featherShadow,0.38);

  yellowchickhatchDrawWisp(ctx,-39,-181,9,-2.65,-2,palette.chickMid,1.7,0.40);
  yellowchickhatchDrawWisp(ctx,-48,-153,8,3.08,1,palette.chickMid,1.7,0.34);
  yellowchickhatchDrawWisp(ctx,-40,-125,9,2.58,-1,palette.chickMid,1.7,0.38);
  yellowchickhatchDrawWisp(ctx,47,-190,8,-0.45,1,palette.chickLight,1.7,0.36);
  yellowchickhatchDrawWisp(ctx,64,-166,8,-0.06,-1,palette.chickMid,1.7,0.34);
  yellowchickhatchDrawWisp(ctx,58,-122,9,0.54,2,palette.chickMid,1.7,0.38);

  yellowchickhatchDrawFace(ctx, palette, blink);
  ctx.restore();
  ctx.restore();
}

function yellowchickhatchDrawLooseFragments(ctx, x, y, scale, palette, open, variant) {
  if (open <= 0 || open >= 1) return;
  const fade = Math.sin(open * Math.PI);
  const pieces = variant === 1
    ? [[-25,-85,-34,-26,-0.8],[31,-69,43,-19,0.7]]
    : [[-32,-92,-42,-28,-0.9],[28,-76,39,-22,0.75]];
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.globalAlpha *= fade * 0.86;
  ctx.fillStyle = palette.shell;
  ctx.strokeStyle = palette.shellShade;
  ctx.lineWidth = 2;
  for (const p of pieces) {
    ctx.save();
    ctx.translate(yellowchickhatchLerp(p[0],p[2],open), yellowchickhatchLerp(p[1],p[3],open) - Math.sin(open*Math.PI)*22);
    ctx.rotate(p[4]*open);
    ctx.beginPath();
    ctx.moveTo(-7,-4); ctx.lineTo(7,-6); ctx.lineTo(3,7); ctx.lineTo(-5,5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function yellowchickhatchDrawAnimation(ctx, x, y, scale, elapsed, duration, variant = 0) {
  const progress = yellowchickhatchClamp(elapsed / duration, 0, 1);
  const variantIndex = Math.abs(Math.floor(variant)) % YELLOWCHICKHATCH_PALETTES.length;
  const palette = YELLOWCHICKHATCH_PALETTES[variantIndex];
  const direction = variantIndex === 1 ? -1 : 1;

  // Phase 1: the detailed speckled egg rises and settles at the anchor.
  const rise = yellowchickhatchEaseOutCubic(yellowchickhatchSmoothstep(0, 0.17, progress));
  const riseBounce = progress < 0.22 ? yellowchickhatchDamped(yellowchickhatchClamp((progress - 0.10) / 0.12,0,1), 2.4, 3.5) * 7 : 0;
  const eggY = yellowchickhatchLerp(y + 88 * scale, y, rise) + riseBounce * scale;
  const eggScale = yellowchickhatchLerp(0.76, 1, rise) * scale;

  // Phase 2: one main crack and two branches grow, with attached shell chips lifting.
  const crackProgress = yellowchickhatchSmoothstep(0.14, 0.43, progress);

  // Phase 3: the shell opens, loose chips arc outward, and the halves settle with visible thickness.
  const open = yellowchickhatchEaseInOutCubic(yellowchickhatchSmoothstep(0.40, 0.66, progress));
  const fullEggAlpha = 1 - yellowchickhatchSmoothstep(0.48, 0.57, progress);
  const halfAlpha = yellowchickhatchSmoothstep(0.46, 0.57, progress);

  // Phase 4: the chick rises with a squash-and-settle, then performs exactly two wing lifts.
  const reveal = yellowchickhatchEaseOutCubic(yellowchickhatchSmoothstep(0.48, 0.75, progress));
  const emergeLocal = yellowchickhatchClamp((progress - 0.48) / 0.30, 0, 1);
  const settle = yellowchickhatchDamped(emergeLocal, 3.2, 4.2);
  const chickGroundY = yellowchickhatchLerp(y + 66 * scale, y, reveal) + settle * 7 * scale;
  const chickScale = yellowchickhatchLerp(0.77, 1, reveal) * scale;

  const wingLocal = yellowchickhatchClamp((progress - 0.66) / 0.25, 0, 1);
  const wingLift = progress >= 0.66 && progress <= 0.91 ? Math.pow(Math.abs(Math.sin(wingLocal * Math.PI * 2)), 0.86) : 0;
  const featherSpread = progress >= 0.67 && progress <= 0.92
    ? Math.pow(Math.abs(Math.sin(yellowchickhatchClamp((progress - 0.675) / 0.245, 0, 1) * Math.PI * 2)), 0.90)
    : 0;
  const bodyCompression = Math.max(
    yellowchickhatchWindow(progress, 0.642, 0.695),
    yellowchickhatchWindow(progress, 0.765, 0.818)
  );

  // One slow breath and a small weight transfer end at a completely still final pose.
  const breathing = progress >= 0.83 && progress <= 1
    ? Math.sin(((progress - 0.83) / 0.17) * Math.PI * 2) * (1 - yellowchickhatchSmoothstep(0.94, 1, progress))
    : 0;
  const weightPhase = yellowchickhatchSmoothstep(0.86, 0.975, progress);
  const weightShift = 3.2 * weightPhase + Math.sin(weightPhase * Math.PI * 2) * 2.1 * (1 - weightPhase);
  const blink = yellowchickhatchWindow(progress, 0.865, 0.925);

  ctx.save();
  ctx.fillStyle = 'rgba(70,64,54,0.19)';
  ctx.beginPath();
  ctx.ellipse(x, y + 8 * scale, 116 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha *= fullEggAlpha;
  yellowchickhatchDrawEgg(ctx, x, eggY, eggScale, palette, crackProgress, variantIndex);
  ctx.restore();

  yellowchickhatchDrawLooseFragments(ctx, x, y, scale, palette, open, variantIndex);

  yellowchickhatchDrawChick(
    ctx,
    x - 4 * direction * scale,
    chickGroundY,
    chickScale,
    direction,
    palette,
    reveal,
    wingLift,
    featherSpread,
    blink,
    settle,
    bodyCompression,
    breathing,
    weightShift
  );

  ctx.save();
  ctx.globalAlpha *= halfAlpha;
  const halfScale = yellowchickhatchLerp(0.95, 0.80, open) * scale;
  const halfY = y - 47 * halfScale + yellowchickhatchLerp(-48, 0, open) * scale;
  const leftX = x - yellowchickhatchLerp(17, 112, open) * scale;
  const rightX = x + yellowchickhatchLerp(17, 112, open) * scale;
  yellowchickhatchDrawShellHalf(ctx, leftX, halfY, halfScale, -yellowchickhatchLerp(0.03, 0.20, open), -1, palette, variantIndex);
  yellowchickhatchDrawShellHalf(ctx, rightX, halfY, halfScale, yellowchickhatchLerp(0.03, 0.20, open), 1, palette, variantIndex);
  ctx.restore();
  ctx.restore();
}


  function yellowchickhatchDrawPin(pin, current) {
    const elapsed = Math.min(current - pin.rocket.startedAt, YELLOWCHICKHATCH_DURATION_MS);
    const scale = Math.min(view.w / 430, view.h / 720);
    const leftExtent = 200 * scale;
    const rightExtent = 199 * scale;
    const topExtent = 227 * scale;
    const bottomExtent = 123 * scale;
    const anchorX = clamp(pin.x, leftExtent + 8, view.w - rightExtent - 8);
    const intendedAnchorY = pin.y + layout.pinH * 0.58;
    const anchorY = clamp(intendedAnchorY, topExtent + 8, view.h - bottomExtent - 8);
    yellowchickhatchDrawAnimation(
      ctx,
      anchorX,
      anchorY,
      scale,
      elapsed,
      YELLOWCHICKHATCH_DURATION_MS,
      pin.rocket.variant
    );
  }

  function sofashufflefivepillowsv1DrawPin(pin, current) {
    const elapsed = current - pin.rocket.startedAt;
    const scale = Math.min(view.w / 900, view.h / 620);
    const marginX = 270 * scale;
    const anchorX = clamp(pin.x, marginX, view.w - marginX);
    const anchorY = Math.min(pin.y + layout.pinH * 0.70, view.h - 90 * scale);
    sofashufflefivepillowsv1Draw(ctx, anchorX, anchorY, scale, elapsed, pin.rocket.duration);
  }


  // PLAYER, BALL, AND MAIN UI DRAWING
  // =====================================================
  function drawRoller() {
    const x = layout.rollerX;
    const y = layout.rollerY;
    const r = layout.ballR;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const baseGrad = ctx.createLinearGradient(x - r * 2.0, y - r * 0.8, x + r * 2.0, y + r * 1.3);
    baseGrad.addColorStop(0, "#b99aff");
    baseGrad.addColorStop(0.55, "#8058dc");
    baseGrad.addColorStop(1, "#5130a8");
    ctx.fillStyle = baseGrad;
    ctx.strokeStyle = "rgba(55,35,125,0.62)";
    ctx.lineWidth = Math.max(2, r * 0.08);
    roundRect(ctx, x - r * 1.55, y - r * 0.16, r * 3.10, r * 1.15, r * 0.34);
    ctx.fill();
    ctx.stroke();

    const railGrad = ctx.createLinearGradient(x - r * 1.8, y - r * 1.35, x + r * 1.8, y + r * 0.2);
    railGrad.addColorStop(0, "#ffe36d");
    railGrad.addColorStop(1, "#ffb739");
    ctx.fillStyle = railGrad;
    roundRect(ctx, x - r * 1.75, y - r * 1.03, r * 0.64, r * 1.14, r * 0.28);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, x + r * 1.11, y - r * 1.03, r * 0.64, r * 1.14, r * 0.28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#236dcc";
    ctx.beginPath();
    ctx.arc(x, y + r * 0.56, r * 0.52, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffe36d";
    drawPaw(x, y + r * 0.55, r * 0.34);
    ctx.restore();
  }

  function drawLoadedBall(x, y, r, spin, seed = 0) {
    ctx.save();
    const grad = ctx.createRadialGradient(x - r * 0.34, y - r * 0.42, r * 0.14, x, y, r * 1.12);
    grad.addColorStop(0, "#cbe9ff");
    grad.addColorStop(0.18, "#2476c9");
    grad.addColorStop(0.56, "#0d3b83");
    grad.addColorStop(1, "#071b45");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.46)";
    ctx.lineWidth = Math.max(1.5, r * 0.055);
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin * 0.45 + seed * 0.2);
    ctx.fillStyle = "rgba(2,9,28,0.88)";
    ctx.beginPath();
    ctx.arc(r * 0.12, -r * 0.34, r * 0.14, 0, TAU);
    ctx.arc(r * 0.40, -r * 0.14, r * 0.13, 0, TAU);
    ctx.arc(r * 0.04, r * 0.11, r * 0.15, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 0.42;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x - r * 0.31, y - r * 0.45, r * 0.22, r * 0.10, -0.35, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBallTrail(ball) {
    if (!ball.trail || ball.trail.length < 2) return;
    const points = ball.trail;
    if (ball.specialType === "rainbow") {
      const colors = ["#ff4d6d", "#ffaa33", "#ffe36d", "#63e38c", "#41d6ff", "#8a5cff"];
      for (let i = 1; i < points.length; i += 1) {
        ctx.save(); ctx.strokeStyle = colors[i % colors.length]; ctx.globalAlpha = i / points.length * 0.7; ctx.lineWidth = 4 + (i / points.length) * 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(points[i-1].x, points[i-1].y); ctx.lineTo(points[i].x, points[i].y); ctx.stroke(); ctx.restore();
      }
    } else if (ball.specialType === "yarn") {
      ctx.save(); ctx.strokeStyle = "#ff8ab3"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath();
      points.forEach((pt, i) => { const off = Math.sin(i * 0.9 + ball.spin) * 6; if (i===0) ctx.moveTo(pt.x, pt.y); else ctx.quadraticCurveTo((points[i-1].x+pt.x)/2 + off, (points[i-1].y+pt.y)/2 - off, pt.x, pt.y); });
      ctx.stroke(); ctx.restore();
    } else if (ball.specialType === "comet" || ball.specialType === "meteor") {
      const colors = ball.specialType === "meteor" ? ["rgba(239,51,64,0.05)","rgba(255,122,49,0.18)","rgba(255,227,109,0.50)"] : ["rgba(255,255,255,0.04)","rgba(123,223,255,0.18)","rgba(255,255,255,0.45)"];
      for (let i = 1; i < points.length; i += 1) {
        ctx.save(); ctx.strokeStyle = colors[Math.min(colors.length - 1, Math.floor(i / Math.max(1, points.length / colors.length)))]; ctx.globalAlpha = i / points.length; ctx.lineWidth = 3 + (i / points.length) * 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(points[i-1].x, points[i-1].y); ctx.lineTo(points[i].x, points[i].y); ctx.stroke(); ctx.restore();
      }
    } else if (ball.specialType === "superbounce") {
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.42)"; ctx.lineWidth = 3; ctx.setLineDash([6, 8]); ctx.beginPath(); points.forEach((pt, i) => { if (i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); }); ctx.stroke(); ctx.restore();
    } else if (ball.specialType === "giantbounce") {
      ctx.save(); ctx.strokeStyle = "rgba(255,227,109,0.35)"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); points.forEach((pt, i) => { if (i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); }); ctx.stroke(); ctx.restore();
    }
  }

  function drawBall() {
    if (!game.ball) return;
    drawBallTrail(game.ball);
    const squash = game.ball.squashUntil > nowMs() ? 1 + (game.ball.specialType === "superbounce" ? 0.18 : 0.08) : 1;
    ctx.save();
    if (game.ball.specialType === "superbounce" && game.ball.squashUntil > nowMs()) { ctx.translate(game.ball.x, game.ball.y); ctx.scale(1.18, 0.84); ctx.translate(-game.ball.x, -game.ball.y); }
    if (game.ball.specialType === "giantbounce") { ctx.globalAlpha = 0.22; ctx.fillStyle = "#ffe36d"; ctx.beginPath(); ctx.arc(game.ball.x, game.ball.y, game.ball.r * 1.28 + Math.sin(game.ball.spin * 1.5) * 3, 0, TAU); ctx.fill(); }
    drawLoadedBall(game.ball.x, game.ball.y, game.ball.r, game.ball.spin, game.ball.colorSeed);
    ctx.restore();
  }

  function drawCat() {
    const x = layout.catX;
    const y = layout.catY;
    const s = layout.radius * 0.84;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Tail behind body.
    ctx.strokeStyle = "#d9651f";
    ctx.lineWidth = s * 0.28;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y + s * 0.18);
    ctx.bezierCurveTo(x - s * 1.45, y - s * 0.2, x - s * 1.2, y - s * 1.25, x - s * 0.42, y - s * 0.88);
    ctx.stroke();

    // Body.
    const bodyGrad = ctx.createRadialGradient(x - s * 0.18, y - s * 0.48, s * 0.2, x, y, s * 1.2);
    bodyGrad.addColorStop(0, "#ffbd63");
    bodyGrad.addColorStop(1, "#f07b28");
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = "#b74f18";
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.12, s * 0.62, s * 0.78, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Head.
    ctx.beginPath();
    ctx.arc(x, y - s * 0.65, s * 0.58, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Ears.
    ctx.fillStyle = "#f07b28";
    ctx.beginPath();
    ctx.moveTo(x - s * 0.42, y - s * 1.02);
    ctx.lineTo(x - s * 0.26, y - s * 1.55);
    ctx.lineTo(x - s * 0.04, y - s * 1.02);
    ctx.closePath();
    ctx.moveTo(x + s * 0.42, y - s * 1.02);
    ctx.lineTo(x + s * 0.26, y - s * 1.55);
    ctx.lineTo(x + s * 0.04, y - s * 1.02);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stripes.
    ctx.strokeStyle = "#b84e18";
    ctx.lineWidth = s * 0.055;
    for (const offset of [-0.22, 0, 0.22]) {
      ctx.beginPath();
      ctx.moveTo(x + offset * s, y - s * 1.18);
      ctx.lineTo(x + offset * s * 0.7, y - s * 0.92);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - s * 0.48, y - s * 0.52);
    ctx.lineTo(x - s * 0.22, y - s * 0.58);
    ctx.moveTo(x + s * 0.48, y - s * 0.52);
    ctx.lineTo(x + s * 0.22, y - s * 0.58);
    ctx.stroke();

    // Face.
    ctx.fillStyle = "#2d1a12";
    ctx.beginPath();
    ctx.arc(x - s * 0.22, y - s * 0.68, s * 0.055, 0, TAU);
    ctx.arc(x + s * 0.22, y - s * 0.68, s * 0.055, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#ffe6ce";
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.43, s * 0.2, s * 0.15, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#65301c";
    ctx.beginPath();
    ctx.arc(x, y - s * 0.49, s * 0.045, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#65301c";
    ctx.lineWidth = s * 0.035;
    ctx.beginPath();
    ctx.arc(x, y - s * 0.42, s * 0.13, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // Paws.
    ctx.fillStyle = "#ffbd63";
    ctx.strokeStyle = "#b74f18";
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.ellipse(x - s * 0.28, y + s * 0.75, s * 0.19, s * 0.12, -0.1, 0, TAU);
    ctx.ellipse(x + s * 0.28, y + s * 0.75, s * 0.19, s * 0.12, 0.1, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function drawRotatingStatusText(current) {
    const visibleTexts = ROTATING_STATUS_TEXTS;
    const elapsed = Math.max(0, current - game.titleStartedAt);
    const index = Math.floor(elapsed / ROTATING_TEXT_MS) % visibleTexts.length;
    const text = visibleTexts[index] || visibleTexts[0];
    const x = layout.statusX;
    const y = layout.statusY;
    const w = layout.statusW;
    const h = layout.statusH;

    if (w < layout.radius * 1.7) return;

    ctx.save();
    ctx.globalAlpha = 0.84;
    ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
    ctx.strokeStyle = "rgba(53, 113, 178, 0.22)";
    ctx.lineWidth = Math.max(1.5, layout.radius * 0.035);
    roundRect(ctx, x, y, w, h, Math.max(14, layout.radius * 0.28));
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#29599d";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const fontSize = clamp(w * 0.098, 12, layout.radius * 0.43);
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    drawWrappedStatusText(text, x + w * 0.08, y + h * 0.50, w * 0.84, fontSize, 3);
    ctx.restore();
  }

  function drawWrappedStatusText(text, x, centerY, maxWidth, fontSize, maxLines) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);

    const clipped = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/[.,;:!?]*$/, "")}â€¦`;
    }

    const lineHeight = fontSize * 1.16;
    const startY = centerY - ((clipped.length - 1) * lineHeight) / 2;
    for (let i = 0; i < clipped.length; i += 1) {
      ctx.fillText(clipped[i], x, startY + i * lineHeight);
    }
  }

  function drawHoldProgress(current) {
    if (!game.hold) return;
    const t = clamp((current - game.hold.startedAt) / LONG_PRESS_MS, 0, 1);
    const s = layout.ballR * 0.84;
    ctx.save();
    ctx.strokeStyle = "rgba(94, 56, 180, 0.80)";
    ctx.lineWidth = Math.max(3, s * 0.10);
    ctx.beginPath();
    ctx.arc(layout.catX, layout.catY - s * 0.38, s * 1.08, -Math.PI / 2, -Math.PI / 2 + TAU * t);
    ctx.stroke();
    ctx.restore();
  }

  function drawReward(current) {
    if (game.phase !== "reward") return;
    const t = clamp((current - game.rewardStartedAt) / LEVEL_REWARD_MS, 0, 1);
    const pulse = 1 + Math.sin(t * Math.PI * 5) * 0.035;
    const alpha = t < 0.82 ? 1 : clamp(1 - (t - 0.82) / 0.18, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = clamp(view.w * 0.20, 72, 150) * pulse;
    ctx.font = `1000 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.lineWidth = Math.max(7, size * 0.08);
    ctx.strokeStyle = "rgba(71, 55, 160, 0.72)";
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("MEOW!", view.w / 2, view.h * 0.43);
    ctx.fillText("MEOW!", view.w / 2, view.h * 0.43);
    ctx.restore();
  }

  function drawTitleOverlay(current) {
    const alpha = currentTitleAlpha(current);
    if (alpha <= 0) {
      hideStartOverlay();
      if (game.phase === "title") enterPlayingPhase(null, game.forceHitNext, "title-overlay-faded");
      return;
    }
    showStartOverlay();
    ctx.save();
    ctx.globalAlpha = alpha;
    const bg = ctx.createLinearGradient(0, 0, 0, view.h);
    bg.addColorStop(0, "rgba(54, 172, 255, 0.94)");
    bg.addColorStop(0.65, "rgba(171, 236, 255, 0.90)");
    bg.addColorStop(1, "rgba(255, 255, 255, 0.78)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, view.w, view.h);

    ctx.globalAlpha = alpha * 0.22;
    drawPins(current);
    drawCat();
    drawRoller();

    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const titleSize = clamp(view.w * 0.105, 36, 82);
    const y = view.h * 0.34;
    ctx.font = `1000 ${titleSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.lineWidth = Math.max(4, titleSize * 0.11);
    ctx.strokeStyle = "rgba(38, 72, 160, 0.72)";
    ctx.fillStyle = "#ffe36d";
    ctx.strokeText("Meowmoon", view.w / 2, y - titleSize * 0.34);
    ctx.fillText("Meowmoon", view.w / 2, y - titleSize * 0.34);
    ctx.font = `900 ${titleSize * 0.62}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("Bowling", view.w / 2, y + titleSize * 0.52);
    ctx.fillText("Bowling", view.w / 2, y + titleSize * 0.52);
    ctx.font = `750 ${clamp(view.w * 0.044, 17, 28)}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = "#34308b";
    ctx.fillText("Tap anywhere to play", view.w / 2, y + titleSize * 1.45);
    ctx.restore();
  }

  function drawPauseCat(cx, cy, size) {
    const s = size;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Raised paws.
    ctx.strokeStyle = "#b74f18";
    ctx.lineWidth = s * 0.14;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.42, cy + s * 0.15);
    ctx.quadraticCurveTo(cx - s * 0.95, cy - s * 0.28, cx - s * 0.72, cy - s * 0.78);
    ctx.moveTo(cx + s * 0.42, cy + s * 0.15);
    ctx.quadraticCurveTo(cx + s * 0.95, cy - s * 0.28, cx + s * 0.72, cy - s * 0.78);
    ctx.stroke();

    ctx.fillStyle = "#ffbd63";
    ctx.strokeStyle = "#b74f18";
    ctx.lineWidth = s * 0.045;
    ctx.beginPath();
    ctx.ellipse(cx - s * 0.74, cy - s * 0.82, s * 0.20, s * 0.24, -0.25, 0, TAU);
    ctx.ellipse(cx + s * 0.74, cy - s * 0.82, s * 0.20, s * 0.24, 0.25, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Body and head.
    const bodyGrad = ctx.createRadialGradient(cx - s * 0.18, cy - s * 0.18, s * 0.2, cx, cy, s * 1.1);
    bodyGrad.addColorStop(0, "#ffbd63");
    bodyGrad.addColorStop(1, "#f07b28");
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = "#b74f18";
    ctx.lineWidth = s * 0.055;
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.24, s * 0.55, s * 0.68, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.52, s * 0.55, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Ears.
    ctx.fillStyle = "#f07b28";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.42, cy - s * 0.83);
    ctx.lineTo(cx - s * 0.25, cy - s * 1.35);
    ctx.lineTo(cx - s * 0.03, cy - s * 0.86);
    ctx.closePath();
    ctx.moveTo(cx + s * 0.42, cy - s * 0.83);
    ctx.lineTo(cx + s * 0.25, cy - s * 1.35);
    ctx.lineTo(cx + s * 0.03, cy - s * 0.86);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tabby stripes.
    ctx.strokeStyle = "#b84e18";
    ctx.lineWidth = s * 0.045;
    for (const offset of [-0.22, 0, 0.22]) {
      ctx.beginPath();
      ctx.moveTo(cx + offset * s, cy - s * 1.02);
      ctx.lineTo(cx + offset * s * 0.65, cy - s * 0.78);
      ctx.stroke();
    }

    // Smile and face.
    ctx.fillStyle = "#2d1a12";
    ctx.beginPath();
    ctx.arc(cx - s * 0.2, cy - s * 0.56, s * 0.055, 0, TAU);
    ctx.arc(cx + s * 0.2, cy - s * 0.56, s * 0.055, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#ffe6ce";
    ctx.beginPath();
    ctx.ellipse(cx, cy - s * 0.33, s * 0.22, s * 0.15, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#65301c";
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.39, s * 0.045, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#65301c";
    ctx.lineWidth = s * 0.035;
    ctx.beginPath();
    ctx.arc(cx - s * 0.06, cy - s * 0.32, s * 0.13, 0.15 * Math.PI, 0.9 * Math.PI);
    ctx.arc(cx + s * 0.06, cy - s * 0.32, s * 0.13, 0.1 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  function drawPauseOverlay() {
    if (game.phase !== "paused") return;

    ctx.save();
    ctx.fillStyle = "rgba(25, 48, 90, 0.46)";
    ctx.fillRect(0, 0, view.w, view.h);

    const cardW = Math.min(view.w * 0.86, 720);
    const cardH = Math.min(view.h * 0.52, 520);
    const cardX = (view.w - cardW) / 2;
    const cardY = view.h * 0.23;

    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.strokeStyle = "rgba(56, 98, 180, 0.35)";
    ctx.lineWidth = Math.max(3, view.w * 0.006);
    roundRect(ctx, cardX, cardY, cardW, cardH, Math.max(24, cardW * 0.045));
    ctx.fill();
    ctx.stroke();

    drawPauseCat(view.w / 2, cardY + cardH * 0.36, Math.min(cardW * 0.17, cardH * 0.22));

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#254a9a";
    const fontSize = clamp(cardW * 0.055, 22, 42);
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;

    const lines = [
      "The game is paused.",
      "Meowmoon wants to play",
      "with you again soon"
    ];
    const startY = cardY + cardH * 0.70;
    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i], view.w / 2, startY + i * fontSize * 1.18);
    }

    ctx.restore();
  }

  // =====================================================
  // PARTICLE, STAR, HEART, AND PAW DRAWING HELPERS
  // =====================================================
  function drawParticles(current) {
    for (const p of game.particles) {
      const age = current - p.startedAt;
      const alpha = clamp(1 - age / p.duration, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      if (p.shape === "star" || p.shape === "spark") drawStar(0, 0, p.size, p.size * 0.44, 5);
      else if (p.shape === "heart") {
        drawHeart(0, 0, p.size);
      } else if (p.shape === "treat") {
        roundRect(ctx, -p.size * 0.70, -p.size * 0.38, p.size * 1.4, p.size * 0.76, p.size * 0.24);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = Math.max(1, p.size * 0.10);
        ctx.beginPath();
        ctx.moveTo(-p.size * 0.35, 0);
        ctx.lineTo(p.size * 0.35, 0);
        ctx.stroke();
      } else if (p.shape === "toy") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.55, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath();
        ctx.arc(-p.size * 0.16, -p.size * 0.18, p.size * 0.14, 0, TAU);
        ctx.fill();
      } else if (p.shape === "bubble") {
        ctx.beginPath(); ctx.arc(0, 0, p.size * 0.55, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.arc(-p.size * 0.14, -p.size * 0.18, p.size * 0.16, 0, TAU); ctx.fill();
      } else if (p.shape === "paw") {
        drawPaw(0, 0, p.size * 0.55);
      } else {
        roundRect(ctx, -p.size * 0.55, -p.size * 0.25, p.size * 1.1, p.size * 0.5, p.size * 0.12);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawStar(x, y, outer, inner, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawHeart(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.45);
    ctx.bezierCurveTo(x - s * 0.92, y - s * 0.12, x - s * 0.45, y - s * 0.74, x, y - s * 0.30);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 0.74, x + s * 0.92, y - s * 0.12, x, y + s * 0.45);
    ctx.closePath();
    ctx.fill();
  }

  function drawPaw(x, y, s) {
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.18, s * 0.34, s * 0.30, 0, 0, TAU);
    ctx.ellipse(x - s * 0.34, y - s * 0.16, s * 0.16, s * 0.19, 0, 0, TAU);
    ctx.ellipse(x - s * 0.11, y - s * 0.31, s * 0.16, s * 0.20, 0, 0, TAU);
    ctx.ellipse(x + s * 0.13, y - s * 0.31, s * 0.16, s * 0.20, 0, 0, TAU);
    ctx.ellipse(x + s * 0.36, y - s * 0.15, s * 0.16, s * 0.19, 0, 0, TAU);
    ctx.fill();
  }

  function roundRect(context, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + w - radius, y);
    context.quadraticCurveTo(x + w, y, x + w, y + radius);
    context.lineTo(x + w, y + h - radius);
    context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    context.lineTo(x + radius, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  // =====================================================
  // GALLERY-ONLY SPECIAL ANIMATION PREVIEW MODE
  // =====================================================
  // Used by special-animation-preview.html. Normal gameplay never enters this
  // path because index.html does not set meowmoonGalleryPreview=1.
  function postGalleryPreviewMessage(payload) {
    if (!window.parent || window.parent === window) return;
    window.parent.postMessage({ source: "meowmoon-special-gallery", ...payload }, "*");
  }

  function drawGalleryPreviewBackground(type = "") {
    if (type === "soccergoal") {
      drawBackground();
      return;
    }

    const sky = ctx.createLinearGradient(0, 0, 0, view.h);
    sky.addColorStop(0, "#eaf8ff");
    sky.addColorStop(1, "#fff8df");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, view.w, view.h);

    const groundY = view.h * 0.73;
    ctx.fillStyle = "#ddf7df";
    ctx.fillRect(0, groundY, view.w, view.h - groundY);
    ctx.strokeStyle = "rgba(63, 133, 96, 0.28)";
    ctx.lineWidth = Math.max(2, view.w * 0.003);
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(view.w, groundY);
    ctx.stroke();
  }

  function galleryPreviewAnchorY(type) {
    const lowerForHighFlight = new Set(["cardinalflyoff"]);
    const higherForBottomClearance = new Set([
      "elephantwave",
      "regularwheelchair",
      "firetruck"
    ]);
    const muchHigherForBottomClearance = new Set(["hanbokribbontwirl"]);

    if (lowerForHighFlight.has(type)) return view.h * 0.80;
    if (muchHigherForBottomClearance.has(type)) return view.h * 0.45;
    if (higherForBottomClearance.has(type)) return view.h * 0.56;
    return view.h * 0.69;
  }

  function makeGalleryPreviewPin(type) {
    const anchorY = galleryPreviewAnchorY(type);
    return {
      x: view.w * 0.5,
      y: anchorY,
      baseX: view.w * 0.5,
      baseY: anchorY,
      scale: 1,
      angle: 0,
      specialType: type,
      specialTriggered: true,
      falling: false,
      fallen: false,
      fading: false,
      removed: false,
      rocket: null
    };
  }

  function startSpecialAnimationGalleryPreview() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("meowmoonGalleryPreview") !== "1") return false;
    const previewVariant = params.has("variant") ? clamp(Number(params.get("variant")), 0, 2) : null;

    resize();
    validateSpecialAnimationRegistry();

    const registrySummary = PIN_SPECIAL_TYPES.map(type => {
      const spec = animationSpec(type);
      return {
        id: type,
        label: spec?.label || type,
        updateMode: spec?.updateMode || "custom",
        overlay: !!spec?.overlay
      };
    });

    postGalleryPreviewMessage({
      kind: "registry-summary",
      count: registrySummary.length,
      ids: registrySummary.map(item => item.id),
      animations: registrySummary
    });

    if (params.get("summaryOnly") === "1") {
      drawGalleryPreviewBackground();
      ctx.fillStyle = "#254a9a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${clamp(view.w * 0.040, 16, 28)}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillText(`${registrySummary.length} production special animations`, view.w / 2, view.h / 2);
      return true;
    }

    const requestedType = params.get("animation") || "";
    const spec = animationSpec(requestedType);
    if (!spec) {
      drawGalleryPreviewBackground();
      ctx.fillStyle = "#9d174d";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${clamp(view.w * 0.038, 15, 26)}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillText(`Unknown animation: ${requestedType || "(blank)"}`, view.w / 2, view.h / 2);
      postGalleryPreviewMessage({ kind: "status", id: requestedType, ok: false, status: "Missing registry entry" });
      return true;
    }

    const state = {
      type: requestedType,
      pin: null,
      paused: false,
      pausedAt: 0,
      lastFrame: 0,
      restartAt: 0,
      lastStatus: ""
    };

    function setStatus(status, ok = true, detail = "") {
      const text = detail ? `${status}: ${detail}` : status;
      if (text === state.lastStatus) return;
      state.lastStatus = text;
      postGalleryPreviewMessage({
        kind: "status",
        id: state.type,
        ok,
        status: text,
        durationMs: state.pin?.rocket?.duration || 0,
        removed: !!state.pin?.removed
      });
    }

    function restart(current) {
      game.particles = [];
      state.pin = makeGalleryPreviewPin(state.type);
      launchSpecialPin(state.pin, current, state.type);
      if ((state.type === "yellowchickhatch" || state.type === "babystegosaurushatch" || state.type === "kangaroopouchsurprise" || state.type === "wombatburrowbuilder") && previewVariant !== null && state.pin.rocket) {
        state.pin.rocket.variant = previewVariant;
      }
      game.pins = [state.pin];
      state.lastFrame = current;
      state.restartAt = 0;
      setStatus("OK");
    }

    window.addEventListener("message", event => {
      const action = event.data?.action;
      if (event.data?.source !== "meowmoon-special-gallery-control") return;
      if (action === "restart" || action === "play") {
        state.paused = false;
        restart(performance.now());
      } else if (action === "pause") {
        state.paused = true;
        state.pausedAt = state.lastFrame || performance.now();
        setStatus("Paused");
      } else if (action === "resume") {
        state.paused = false;
        const now = performance.now();
        const pausedFor = now - state.pausedAt;
        if (state.pin?.rocket) {
          state.pin.rocket.startedAt += pausedFor;
          state.pin.rocket.burstAt += pausedFor;
          state.pin.rocket.popAt += pausedFor;
          state.pin.rocket.meltAt += pausedFor;
          state.pin.rocket.swipeAt += pausedFor;
          state.pin.rocket.finishAt += pausedFor;
        }
        state.lastFrame = now;
        setStatus("OK");
      }
    });

    function loop(current) {
      try {
        if (!state.pin) restart(current);
        if (state.restartAt && current >= state.restartAt) restart(current);

        const effectiveCurrent = state.paused ? state.pausedAt : current;
        const dt = Math.max(0, Math.min(0.05, (effectiveCurrent - (state.lastFrame || effectiveCurrent)) / 1000));
        if (!state.paused && state.pin && !state.pin.removed && !state.restartAt) {
          updateSpecialPin(state.pin, effectiveCurrent, dt);
          updateParticles(effectiveCurrent, dt);
          state.lastFrame = effectiveCurrent;
        }

        drawGalleryPreviewBackground(state.type);
        if (state.pin && !state.pin.removed) {
          drawSpecialPin(state.pin, effectiveCurrent);
        } else if (!state.restartAt) {
          setStatus("Completed", true, "looping shortly");
          state.restartAt = current + 520;
        }
        drawParticles(effectiveCurrent);
      } catch (err) {
        console.error("Gallery preview animation failed.", state.type, err);
        setStatus("Error", false, err?.message || String(err));
        state.restartAt = current + 1500;
      } finally {
        requestAnimationFrame(loop);
      }
    }

    requestAnimationFrame(loop);
    return true;
  }

  let lastFrame = nowMs();
  // =====================================================
  // MAIN LOOP AND STARTUP
  // =====================================================
  function drawEmergencyStartScreen() {
    try {
      const sky = ctx.createLinearGradient(0, 0, 0, view.h);
      sky.addColorStop(0, "#53cfff");
      sky.addColorStop(1, "#e3fbff");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${clamp(view.w * 0.085, 30, 60)}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(38, 72, 160, 0.72)";
      ctx.fillStyle = "#ffe36d";
      ctx.strokeText("Meowmoon", view.w / 2, view.h * 0.38);
      ctx.fillText("Meowmoon", view.w / 2, view.h * 0.38);
      ctx.font = `800 ${clamp(view.w * 0.040, 17, 28)}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillStyle = "#34308b";
      ctx.fillText("Tap anywhere to play", view.w / 2, view.h * 0.51);
    } catch (err) {
      console.error("Emergency start screen failed.", err);
    }
  }

  function loop(current) {
    try {
      update(current);
      lastFrame = current;
      render(current);
    } catch (err) {
      console.error("Main loop recovered from an error.", err);
      ensureStartupReady("loop-error");
      showStartOverlay();
      drawEmergencyStartScreen();
    } finally {
      requestAnimationFrame(loop);
    }
  }

  if (startSpecialAnimationGalleryPreview()) return;

  resize();
  validateSpecialAnimationRegistry();
  startLevel();
  ensureStartupReady("initial-startup");
  window.setTimeout(() => ensureStartupReady("delayed-startup-check"), STARTUP_READY_CHECK_MS);
  requestAnimationFrame(loop);
})();
