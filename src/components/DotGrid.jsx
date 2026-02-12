import { useRef, useEffect } from "react";

const DotGrid = ({
    gridSize = 40,
    dotSize = 4,
    gap = 20,
    baseColor = "#222",
    activeColor = "#5227FF",
    proximity = 100,
    speedTrigger = 50,
    shockStrength = 10,
    shockRadius = 150,
    maxSpeed = 1500,
    resistance = 0.9,
    returnDuration = 0.5,
}) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const container = canvas.parentElement;
        let width = container.offsetWidth;
        let height = container.offsetHeight;
        let dpi = window.devicePixelRatio || 1;

        canvas.width = width * dpi;
        canvas.height = height * dpi;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpi, dpi);

        let mouse = { x: -1000, y: -1000 };
        let dots = [];

        const initDots = () => {
            dots = [];
            const cols = Math.ceil(width / gap);
            const rows = Math.ceil(height / gap);

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    dots.push({
                        originX: j * gap,
                        originY: i * gap,
                        x: j * gap,
                        y: i * gap,
                        vx: 0,
                        vy: 0,
                    });
                }
            }
        };

        initDots();

        let animationId;

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            for (let dot of dots) {
                const dx = mouse.x - dot.x;
                const dy = mouse.y - dot.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Force calculation
                if (dist < proximity) {
                    const angle = Math.atan2(dy, dx);
                    const force = (proximity - dist) / proximity;
                    const push = force * shockStrength;

                    dot.vx -= Math.cos(angle) * push;
                    dot.vy -= Math.sin(angle) * push;
                }

                // Friction
                dot.vx *= resistance;
                dot.vy *= resistance;

                // Return to origin (spring)
                dot.x += (dot.originX - dot.x) * (1 / returnDuration) * 0.1;
                dot.y += (dot.originY - dot.y) * (1 / returnDuration) * 0.1;

                // Add velocity
                dot.x += dot.vx;
                dot.y += dot.vy;

                // Draw
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2);
                ctx.fillStyle = dist < proximity ? activeColor : baseColor;
                ctx.fill();
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleResize = () => {
            width = container.offsetWidth;
            height = container.offsetHeight;
            canvas.width = width * dpi;
            canvas.height = height * dpi;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpi, dpi);
            initDots();
        };

        window.addEventListener("resize", handleResize);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });

        return () => {
            window.removeEventListener("resize", handleResize);
            canvas.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationId);
        };

    }, [gap, dotSize, proximity, shockStrength, resistance, returnDuration, baseColor, activeColor]);

    return <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />;
};

export default DotGrid;
