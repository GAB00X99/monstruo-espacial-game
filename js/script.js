window.requestAnimFrame = function () {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback);
      }
    );
  };
  
  function init(elemid) {
    let canvas = document.getElementById(elemid),
      c = canvas.getContext("2d"),
      w = (canvas.width = window.innerWidth),
      h = (canvas.height = window.innerHeight);
    c.fillStyle = "rgba(30,30,30,1)";
    c.fillRect(0, 0, w, h);
    return { c: c, canvas: canvas };
  }
  let projectiles = []; // Almacena los proyectiles disparados
  let projectileSpeed = 8; // Velocidad de los proyectiles
  let projectileSize = 3; // Tamaño de los proyectiles
  let shooting = false; // Estado de disparo
  
  window.onload = function () {
let canvasData = init("canvas");
let c = canvasData.c;
let canvas = canvasData.canvas;
let w = (canvas.width = window.innerWidth);
let h = (canvas.height = window.innerHeight);
let mouse = { x: false, y: false };
let last_mouse = {};

  
    function dist(p1x, p1y, p2x, p2y) {
      return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
    }
  
    class segment {
      constructor(parent, l, a, first) {
        this.first = first;
        if (first) {
          this.pos = {
            x: parent.x,
            y: parent.y
          };
        } else {
          this.pos = {
            x: parent.nextPos.x,
            y: parent.nextPos.y
          };
        }
        this.l = l;
        this.ang = a;
        this.nextPos = {
          x: this.pos.x + this.l * Math.cos(this.ang),
          y: this.pos.y + this.l * Math.sin(this.ang)
        };
      }
      update(t) {
        this.ang = Math.atan2(t.y - this.pos.y, t.x - this.pos.x);
        this.pos.x = t.x + this.l * Math.cos(this.ang - Math.PI);
        this.pos.y = t.y + this.l * Math.sin(this.ang - Math.PI);
        this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
        this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
      }
      fallback(t) {
        this.pos.x = t.x;
        this.pos.y = t.y;
        this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
        this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
      }
      show() {
        c.lineTo(this.nextPos.x, this.nextPos.y);
      }
    }
  
    class tentacle {
      constructor(x, y, l, n, a) {
        this.x = x;
        this.y = y;
        this.l = l;
        this.n = n;
        this.t = {};
        this.rand = Math.random();
        this.segments = [new segment(this, this.l / this.n, 0, true)];
        for (let i = 1; i < this.n; i++) {
          this.segments.push(
            new segment(this.segments[i - 1], this.l / this.n, 0, false)
          );
        }
        this.gunOffset = { x: 20, y: 0 }; // Ajusta los valores según la posición del cañón en relación con el centro del monstruo
      }
    
      move(last_target, target) {
        this.angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.dt = dist(last_target.x, last_target.y, target.x, target.y) + 5;
        this.t = {
          x: target.x - 0.8 * this.dt * Math.cos(this.angle),
          y: target.y - 0.8 * this.dt * Math.sin(this.angle),
        };
      
        // Calcula el ángulo de disparo hacia el objetivo
        let shootAngle = Math.atan2(target.y - this.y, target.x - this.x);
      
        // Ajusta el ángulo para permitir un rango de 360 grados
        if (this.t.x === undefined) {
          if (shootAngle > Math.PI / 2) {
            shootAngle -= Math.PI * 2;
          } else if (shootAngle < -Math.PI / 2) {
            shootAngle += Math.PI * 2;
          }
        }
      
        if (this.t.x) {
          this.segments[this.n - 1].update(this.t, shootAngle);
        } else {
          this.segments[this.n - 1].update(target, shootAngle);
        }
      
        // Actualiza los segmentos restantes
        for (let i = this.n - 2; i >= 0; i--) {
          this.segments[i].update(this.segments[i + 1].pos, shootAngle);
        }
      
        // Realiza el ajuste de fallback si es necesario
        if (
          dist(this.x, this.y, target.x, target.y) <=
          this.l + dist(last_target.x, last_target.y, target.x, target.y)
        ) {
          this.segments[0].fallback({ x: this.x, y: this.y });
          for (let i = 1; i < this.n; i++) {
            this.segments[i].fallback(this.segments[i - 1].nextPos);
          }
        }
      }
      
    
      show(target) {
        if (dist(this.x, this.y, target.x, target.y) <= this.l) {
          c.globalCompositeOperation = "lighter";
          c.beginPath();
          c.lineTo(this.x, this.y);
          for (let i = 0; i < this.n; i++) {
            this.segments[i].show();
          }
          c.strokeStyle =
            "hsl(" +
            (this.rand * 60 + 180) +
            ",100%," +
            (this.rand * 60 + 25) +
            "%)";
          c.lineWidth = this.rand * 2;
          c.lineCap = "round";
          c.lineJoin = "round";
          c.stroke();
          c.globalCompositeOperation = "source-over";
        }
      }
    
      show2(target) {
        c.beginPath();
        if (dist(this.x, this.y, target.x, target.y) <= this.l) {
          c.arc(this.x, this.y, 2 * this.rand + 1, 0, 2 * Math.PI);
          c.fillStyle = "white";
        } else {
          c.arc(this.x, this.y, this.rand * 2, 0, 2 * Math.PI);
          c.fillStyle = "white";
        }
        c.fill();
      }
    }
    
    let maxl = 300,
      minl = 50,
      n = 30,
      numt = 500,
      tent = [],
      clicked = false,
      target = { x: 0, y: 0 },
      last_target = {},
      t = 0,
      q = 10;
  
    for (let i = 0; i < numt; i++) {
      tent.push(
        new tentacle(
          Math.random() * w,
          Math.random() * h,
          Math.random() * (maxl - minl) + minl,
          n,
          Math.random() * 2 * Math.PI
        )
      );
    }
    let lastMouseX = 0;
let lastMouseY = 0;

// ...
let lastTarget = { x: 0, y: 0 };

function draw() {
  if (mouse.x) {
    lastMouseX = mouse.x;
    lastMouseY = mouse.y;
    target.errx = mouse.x - target.x;
    target.erry = mouse.y - target.y;
  } else {
    target.errx =
      w / 2 +
      ((h / 2 - q) * Math.sqrt(2) * Math.cos(t)) /
        (Math.pow(Math.sin(t), 2) + 1) -
      target.x;
    target.erry =
      h / 2 +
      ((h / 2 - q) * Math.sqrt(2) * Math.cos(t) * Math.sin(t)) /
        (Math.pow(Math.sin(t), 2) + 1) -
      target.y;
  }

  target.x += target.errx / 10;
  target.y += target.erry / 10;

  t += 0.01;

  c.beginPath();
  c.arc(
    target.x,
    target.y,
    dist(lastTarget.x, lastTarget.y, target.x, target.y) + 5,
    0,
    2 * Math.PI
  );
  c.fillStyle = "hsl(210,100%,80%)";
  c.fill();

  for (let i = 0; i < numt; i++) {
    tent[i].move(lastTarget, target);
    tent[i].show2(target);
  }

  for (let i = 0; i < numt; i++) {
    tent[i].show(target);
  }

  for (let i = 0; i < projectiles.length; i++) {
    const proj = projectiles[i];
    c.beginPath();
    c.arc(proj.x, proj.y, projectileSize, 0, Math.PI * 2);
    c.fillStyle = "white"; // Color de los proyectiles
    c.fill();
  }

  lastTarget.x = target.x;
  lastTarget.y = target.y;
}


// ...



// Dentro del evento de dejar de mover el mouse
function handleMouseLeave() {
  mouse.x = lastMouseX;
  mouse.y = lastMouseY;
}

    
  
    canvas.addEventListener(
      "mousemove",
      function (e) {
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;
  
        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
      },
      false
    );
  
    canvas.addEventListener("mouseleave", function (e) {
      mouse.x = false;
      mouse.y = false;
    });
  
    canvas.addEventListener(
      "mousedown",
      function (e) {
        clicked = true;
      },
      false
    );
  
    canvas.addEventListener(
      "mouseup",
      function (e) {
        clicked = false;
      },
      false
    );
  
    function loop() {
      window.requestAnimFrame(loop);
      c.clearRect(0, 0, w, h);
      draw();
    
      if (clicked && !shooting) {
        shooting = true;
        shoot(); // Asegúrate de que la función shoot() esté implementada correctamente.
      }
    
      if (!clicked) {
        shooting = false;
      }
    
      // Recorre los proyectiles al revés para evitar problemas al eliminar elementos.
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.dx;
        proj.y += proj.dy;
    
        // Elimina los proyectiles cuando salen de la pantalla.
        if (proj.x < 0 || proj.x > w || proj.y < 0 || proj.y > h) {
          projectiles.splice(i, 1);
        }
      }
    }
    function shoot() {
      const x = lastTarget.x;
      const y = lastTarget.y;
      const angle = Math.atan2(mouse.y - y, mouse.x - x);
      const dx = Math.cos(angle) * projectileSpeed;
      const dy = Math.sin(angle) * projectileSpeed;
      projectiles.push({ x, y, dx, dy });
    }
  
    window.addEventListener("resize", function () {
      (w = canvas.width = window.innerWidth),
        (h = canvas.height = window.innerHeight);
      loop();
    });
  
    loop();
    setInterval(loop, 1000 / 60);
  };

