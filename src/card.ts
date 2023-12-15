import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";

function randomColor() {
  let letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export async function generateWelcomeCard(
  username: string,
  avatarUrl: string,
  memberId: string
): Promise<Buffer> {
  const width = 600;
  const height = 250;
  const cornerRadius = 20;
  const avatarRadius = 70;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  const [randomColor1, randomColor2, randomColor3, randomColor4] = [
    randomColor(),
    randomColor(),
    randomColor(),
    randomColor(),
  ];
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, randomColor1);
  gradient.addColorStop(0.33, randomColor2);
  gradient.addColorStop(0.66, randomColor3);
  gradient.addColorStop(1, randomColor4);
  context.fillStyle = gradient;

  context.beginPath();
  context.moveTo(cornerRadius, 0);
  context.lineTo(width - cornerRadius, 0);
  context.quadraticCurveTo(width, 0, width, cornerRadius);
  context.lineTo(width, height - cornerRadius);
  context.quadraticCurveTo(width, height, width - cornerRadius, height);
  context.lineTo(cornerRadius, height);
  context.quadraticCurveTo(0, height, 0, height - cornerRadius);
  context.lineTo(0, cornerRadius);
  context.quadraticCurveTo(0, 0, cornerRadius, 0);
  context.closePath();
  context.fill();

  const centerX = width / 2;
  const centerY = height / 2;

  try {
    const avatar = await loadImage(avatarUrl);

    context.save();
    context.beginPath();
    context.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();
    context.drawImage(
      avatar,
      centerX - avatarRadius,
      centerY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );

    context.beginPath();
    context.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2, true);
    context.lineWidth = 6;
    context.strokeStyle = "#fff";
    context.stroke();
    context.restore();
  } catch (error) {
    console.error("Error loading avatar:", error);
  }

  const bottomPadding = 20;
  const textYPosition = height - bottomPadding;

  context.font = "bold 24pt Sans";
  context.textAlign = "center";
  context.shadowColor = "rgba(0, 0, 0, 0.7)";
  context.shadowBlur = 4;
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  context.fillStyle = "#ffffff";
  context.fillText(username, centerX, textYPosition);

  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;

  context.font = "bold 20pt Sans";
  const topPadding = 30;
  context.shadowColor = "rgba(0, 0, 0, 0.7)";
  context.shadowBlur = 4;
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  context.fillText(`Welcome!`, centerX, topPadding);

  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;

  return canvas.toBuffer("image/png");
}
