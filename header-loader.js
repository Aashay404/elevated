fetch("headerone.html")
  .then((res) => res.text())
  .then((data) => {
    const headerContainer = document.getElementById("header");
    if (!headerContainer) return;
    headerContainer.innerHTML = data;
    const scripts = headerContainer.querySelectorAll("script");
    scripts.forEach((script) => {
      const newScript = document.createElement("script");
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      document.body.appendChild(newScript);
    });
  })
  .catch((error) => {
    console.error("Failed to load header:", error);
  });
