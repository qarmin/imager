console.log("Starting initialization of extension");
let images = document.querySelectorAll('img');
let imageUrls = [];

for (let image of images) {
  imageUrls.push({"source": image.src, "width": image.width, "height": image.height});
}

browser.runtime.sendMessage({imageUrls: imageUrls});
console.log("Script finished");