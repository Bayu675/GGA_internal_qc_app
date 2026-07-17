module.exports = {
  apps: [{
    name: "qc-app",
    script: "node_modules/next/dist/bin/next",
    args: "start",
    cwd: "/home/ryu/Desktop/TOOLS/Internal_Return_System/return-qc-app",
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}