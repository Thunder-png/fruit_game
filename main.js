import {
  Engine,
  Render,
  Runner,
  Bodies,
  World,
  Body,
  Sleeping,
  Events,
} from "matter-js";
import { FRUITS } from "./fruits";

// Engine ve Render oluşturulması
const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.getElementById("canvas-container"),
  options: {
    wireframes: false,
    background: "#F7F4C8",
    width: 720,
    height: 1080,
  },
});

// Dünya oluşturulması
const world = engine.world;

// Çevre elemanlarının oluşturulması
const ground = Bodies.rectangle(960, 1080, 1920, 60, { isStatic: true, render: { fillStyle: "#E6B143" } });
const leftWall = Bodies.rectangle(15, 540, 30, 1080, { isStatic: true, render: { fillStyle: "#E6B143" } });
const rightWall = Bodies.rectangle(710, 540, 30, 1080, { isStatic: true, render: { fillStyle: "#E6B143" } });
const topLine = Bodies.rectangle(640, 265, 1920, 2, { isStatic: true, isSensor: true, render: { fillStyle: "#E6B143" }, label: "topLine" });

// Dünyaya elemanların eklenmesi
World.add(world, [ground, leftWall, rightWall, topLine]);

// Render ve Engine'ın çalıştırılması
Render.run(render);
Runner.run(engine);

// Global değişkenlerin tanımlanması
let currentBody = null;
let currentFruit = null;
let interval = null;
let disableAction = false;

const explosionFrames = [
  "./explosion/Explosion_1.png",
  "./explosion/Explosion_2.png",
  "./explosion/Explosion_3.png",
  "./explosion/Explosion_4.png",
  "./explosion/Explosion_5.png",
  "./explosion/Explosion_6.png",
  "./explosion/Explosion_7.png",
  "./explosion/Explosion_8.png",
  "./explosion/Explosion_9.png",
  "./explosion/Explosion_10.png",
];

// Tüm sprite'ları yüklemek için bir dizi
const explosionSprites = [];

for (let i = 0; i < explosionFrames.length; i++) {
  const sprite = new Image();
  sprite.src = explosionFrames[i];
  explosionSprites.push(sprite);
}

// Animasyon süresi
const animationDuration = 100;

// Animasyon fonksiyonu
function playExplosionAnimation(x, y) {
  let frameIndex = 0;
  const explosionInterval = setInterval(() => {
    if (frameIndex >= explosionSprites.length) {
      clearInterval(explosionInterval);
    } else {
      // Sprite'ı render etme
      const explosionBody = Bodies.circle(x, y, 50, {
        isStatic: true,
        render: {
          sprite: {
            texture: explosionSprites[frameIndex].src,
          },
        },
      });
      World.add(world, explosionBody);

      // Belirli bir süre sonra cisimi dünyadan kaldırma
      setTimeout(() => {
        World.remove(world, explosionBody);
      }, animationDuration);

      frameIndex++;
    }
  }, animationDuration);
}

// Rastgele meyve ekleyen fonksiyon
function addCurrentFruit() {
  const randomFruit = getRandomFruit();

  const body = Bodies.circle(300, 50, randomFruit.radius, {
    label: randomFruit.label,
    isSleeping: true,
    render: {
      fillStyle: randomFruit.color,
      sprite: { texture: `/${randomFruit.label}.png` },
    },
    restitution: 0.2,
  });

  currentBody = body;
  currentFruit = randomFruit;

  World.add(world, body);
}


// Rastgele meyve seçen fonksiyon
function getRandomFruit() {
  const randomIndex = Math.floor(Math.random() * 5);
  const fruit = FRUITS[randomIndex];

  if (currentFruit && currentFruit.label === fruit.label)
    return getRandomFruit();

  return fruit;
}

// Klavye olaylarını dinleyen fonksiyonlar
window.onkeydown = (event) => {
  if (disableAction) return;

  switch (event.code) {
    case "ArrowLeft":
      if (interval) return;
      interval = setInterval(() => {
        if (currentBody.position.x - 20 > 30)
          Body.setPosition(currentBody, { x: currentBody.position.x - 1, y: currentBody.position.y });
      }, 5);
      break;
    case "ArrowRight":
      if (interval) return;
      interval = setInterval(() => {
        if (currentBody.position.x + 20 < 700)
          Body.setPosition(currentBody, { x: currentBody.position.x + 1, y: currentBody.position.y });
      }, 5);
      break;
    case "Space":
      disableAction = true;
      Sleeping.set(currentBody, false);
      setTimeout(() => {
        addCurrentFruit();
        disableAction = false;
      }, 1000);
  }
};

window.onkeyup = (event) => {
  switch (event.code) {
    case "ArrowLeft":
    case "ArrowRight":
      clearInterval(interval);
      interval = null;
  }
};

// Çarpışma olaylarını dinleyen fonksiyon
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    if (collision.bodyA.label === collision.bodyB.label) {
      World.remove(world, [collision.bodyA, collision.bodyB]);

      const index = FRUITS.findIndex((fruit) => fruit.label === collision.bodyA.label);
      // Patlama efektini oluşturma
      playExplosionAnimation(collision.collision.supports[0].x, collision.collision.supports[0].y);

      // Son meyve ise işlem yapılmaz
      if (index === FRUITS.length - 1) return;

      const newFruit = FRUITS[index + 1];
      const body = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: { fillStyle: newFruit.color, sprite: { texture: `/${newFruit.label}.png` } },
          label: newFruit.label,
        }
      );
      World.add(world, body);
    }
    if ((collision.bodyA.label === "topLine" || collision.bodyB.label === "topLine") && !disableAction) {
      alert("Game over");
    }
  });
});

// Başlangıçta meyve eklenmesi
addCurrentFruit();
