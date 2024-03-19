{
let images = document.querySelectorAll('img');
let imageUrls = [];

for (let image of images) {
    if (image.src != "")
  // Do not add duplicated src
  if (!imageUrls.includes(image.src)){
    imageUrls.push(image.src);
  }
}
let scripts = document.getElementsByTagName('script');
 for (let i = scripts.length; i >= 0; i--) {
   if (scripts[i]) {
    console.log(scripts[i]);
     scripts[i].parentNode.removeChild(scripts[i]);
   }
 }

document.body.innerHTML = '';
document.body.style.backgroundColor = '#252525';
document.body.style.height = '100vh';
document.body.style.overflow = 'auto';

let grid = document.createElement('div');
grid.style.display = 'grid';
grid.style.gridTemplateColumns = 'repeat(6, 1fr)';
grid.style.gridGap = '10px';

for (let url of imageUrls) {
  let img = document.createElement('img');
  img.src = url;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  img.style.margin = '2px';

    img.style.cursor = 'pointer';

  img.addEventListener('click', function() {
    window.location.href = this.src;
  });

  img.addEventListener('auxclick', function(event) {
    if (event.button === 1) {
      window.open(this.src, '_blank').blur();
      window.focus();
    }
  });
  grid.appendChild(img);
}

document.body.appendChild(grid);
window.scrollTo(0, 0);

}
undefined;