<script setup>
</script>

<template>
  <div class="app">
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #1a1a1a;
}

.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.connect h1 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #e0e0e0;
}

.connect input {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  background: #1a1a1a;
  border: 1px solid #404040;
  border-radius: 4px;
  font-size: 16px;
  text-transform: uppercase;
  text-align: center;
  color: #e0e0e0;
}

.connect input::placeholder {
  color: #666;
}

.connect button {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  background: #404040;
  color: #e0e0e0;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.connect button:hover {
  background: #505050;
}

.connect button:last-child {
  background: #2a2a2a;
  color: #e0e0e0;
  border: 1px solid #404040;
}

.connect button:last-child:hover {
  background: #333;
}

.header span {
  font-weight: 600;
  color: #e0e0e0;
}

.header button {
  padding: 8px 16px;
  background: #2a2a2a;
  border: 1px solid #404040;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #e0e0e0;
}

.header button:hover {
  background: #333;
}

.editor textarea {
  width: 100%;
  min-height: 500px;
  padding: 20px;
  background: #2a2a2a;
  border: none;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  color: #e0e0e0;
}

.editor textarea::placeholder {
  color: #666;
}
</style>
