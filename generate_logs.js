const fs = require("fs");

const components = ["Engine", "Wing", "Avionics", "Landing Gear", "Hydraulics"];
const aircraftModels = ["BOEING-737", "BOEING-777", "AIRBUS-A320", "BOEING-787", "AIRBUS-A350"];

function getRandomDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date(2025, 5, 15);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateLog() {
  const hours = Math.floor(Math.random() * 280) + 20;
  return {
    aircraftId: aircraftModels[Math.floor(Math.random() * aircraftModels.length)] + "-" + Math.floor(1000 + Math.random() * 9000),
    component: components[Math.floor(Math.random() * components.length)],
    date: getRandomDate(),
    failure: hours > 160 ? Math.random() > 0.7 : Math.random() > 0.95,
    hoursSinceLastMaintenance: hours
  };
}

const logs = Array.from({ length: 300 }, generateLog);

fs.writeFileSync("dummy_maintenance_logs.json", JSON.stringify(logs, null, 2));

console.log("✅ Generated dummy_maintenance_logs.json with 300 entries."); 