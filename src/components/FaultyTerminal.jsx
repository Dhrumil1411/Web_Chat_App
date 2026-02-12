import { useRef, useEffect } from 'react';

const FaultyTerminal = ({
    scale = 1,
    digitSize = 1.5,
    scanlineIntensity = 0.3,
    glitchAmount = 1,
    flickerAmount = 1,
    noiseAmp = 0,
    chromaticAberration = 0,
    dither = 0,
    curvature = 0.2,
    tint = "#ffffff",
    mouseReact = false,
    mouseStrength = 0.2,
    brightness = 1
}) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        const chars = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
        const fontSize = 14 * scale * digitSize;
        const columns = Math.ceil(canvas.width / fontSize);
        const rows = Math.ceil(canvas.height / fontSize);
        const drops = Array(columns).fill(0).map(() => Math.floor(Math.random() * rows));

        // Grid state for static terminal effect
        const grid = [];
        for (let i = 0; i < columns; i++) {
            grid[i] = [];
            for (let j = 0; j < rows; j++) {
                grid[i][j] = chars[Math.floor(Math.random() * chars.length)];
            }
        }

        const draw = () => {
            // Background with fade for trails if desired, but terminal is usually solid
            ctx.fillStyle = `rgba(0, 0, 0, ${0.1 * brightness})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height); // continuously clear/dim

            // Main drawing
            ctx.font = `${fontSize}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let i = 0; i < columns; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * fontSize;
                    const y = j * fontSize;

                    // Randomly update character based on flickerAmount
                    if (Math.random() < 0.01 * flickerAmount) {
                        grid[i][j] = chars[Math.floor(Math.random() * chars.length)];
                    }

                    // Mouse interaction
                    let offsetX = 0;
                    let offsetY = 0;
                    if (mouseReact) {
                        const dx = mouseRef.current.x - x;
                        const dy = mouseRef.current.y - y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 200) {
                            const force = (200 - dist) / 200;
                            offsetX = dx * force * mouseStrength * 0.5;
                            offsetY = dy * force * mouseStrength * 0.5;
                            // Glitch near mouse
                            if (Math.random() < 0.1) {
                                grid[i][j] = chars[Math.floor(Math.random() * chars.length)];
                            }
                        }
                    }

                    // Draw Character
                    ctx.fillStyle = tint;

                    // Global Opacity / Brightness variation
                    ctx.globalAlpha = 0.8 * brightness;

                    // Glitch offset
                    if (Math.random() < 0.001 * glitchAmount) {
                        offsetX += (Math.random() - 0.5) * 10;
                    }

                    ctx.fillText(grid[i][j], x + offsetX + fontSize / 2, y + offsetY + fontSize / 2);
                    ctx.globalAlpha = 1.0;
                }
            }

            // Scanlines
            if (scanlineIntensity > 0) {
                ctx.fillStyle = `rgba(0, 0, 0, ${scanlineIntensity})`;
                for (let i = 0; i < canvas.height; i += 4) {
                    ctx.fillRect(0, i, canvas.width, 2);
                }
            }

            // Vignette / Curvature (fake)
            if (curvature > 0) {
                const gradient = ctx.createRadialGradient(
                    canvas.width / 2, canvas.height / 2, canvas.height / 3,
                    canvas.width / 2, canvas.height / 2, canvas.height
                );
                gradient.addColorStop(0, "rgba(0,0,0,0)");
                gradient.addColorStop(1, `rgba(0,0,0,${curvature * 2})`);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        const handleMouseMove = (e) => {
            if (!mouseReact) return;
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        if (mouseReact) {
            window.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            window.removeEventListener('resize', resize);
            if (mouseReact) {
                window.removeEventListener('mousemove', handleMouseMove);
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, [scale, digitSize, scanlineIntensity, glitchAmount, flickerAmount, curvature, tint, mouseReact, mouseStrength, brightness]);

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#000' }}>
            <canvas
                ref={canvasRef}
                style={{ display: 'block' }}
            />
        </div>
    );
};

export default FaultyTerminal;
