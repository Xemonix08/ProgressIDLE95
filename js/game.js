'use strict';

const qs = (selectors) => document.querySelector(selectors);
const qsa = (selectors) => document.querySelectorAll(selectors);

let player

if (localStorage?.getItem("player")) {
  player = JSON.parse(localStorage.getItem("player"))
}
else if (!localStorage?.getItem("player")) {
  player = {
    progress: new Decimal(.01),
    prevProgress: new Decimal(.01),
    progressPerSecond: new Decimal(0),
    progressPerMillisecond: new Decimal(0),
    generators: new Decimal(0),
    generatorGain: new Decimal(.001),
  };
}

const PAUSED = Symbol.for('gameloop.paused');
const RUNNING = Symbol.for('gameloop.running');

const gameLoop = {
  state: PAUSED,
  updateRate: 33,
  timing: {
    time: 0,
    last: null,
    delta: 0,
    lag: 0,
    total: 0,
  },
  frame: undefined,
  start: function () {
    if (this.state == PAUSED) {
      this.state = RUNNING;
      this.tick = this.tick.bind(this);
      this.tick(performance.now());
    }
  },
  tick: function (time) {
    this.timing.time = time;
    if (this.timing.last === null) {
      this.timing.last = time;
    }
    this.timing.delta = time - this.timing.last;
    this.timing.total += this.timing.delta;
    this.timing.lag += this.timing.delta;
    this.timing.last = time;

    const step = 1000 / this.updateRate;
    while (this.timing.lag >= step) {
      this.timing.lag -= step;
      this.update(step);
    }
    this.render(this.timing.lag / step);
    this.frame = setTimeout(this.tick, this.updateRate, performance.now());
  },
  update: function (dt) {
    if (dt === undefined) {
      dt = this.timing.delta;
    }
    player.prevProgress = player.progress;
    player.progressPerSecond = player.generators.mul(player.generatorGain);
    player.progressPerMillisecond = player.progressPerSecond.div(1000);
    player.progress = player.progress.add(player.progressPerMillisecond.mul(dt));
  },
  render: function (interpolation) {
    const interpolated = lerp(player.prevProgress, player.progress, interpolation);
    qs('#currency-amount').innerHTML = interpolated.toFixed(3);
    qs('#currency-gain').innerHTML = player.progressPerSecond.toFixed(3);
  },
};

function lerp(x, y, p) {
  return Decimal.mul(x, Decimal.sub(1, p)).add(Decimal.mul(y, p));
}

window.addEventListener('DOMContentLoaded', () => {
  qs('#pb95pc-buy-one').addEventListener('click', () => {
    player.generators = player.generators.add(1);
  });
  gameLoop.start();
});

window.onclose(() => {
  localStorage?.setItem("player", JSON.stringify(player))
})