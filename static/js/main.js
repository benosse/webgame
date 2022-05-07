const url = new URL(document.location.href);
const pathname = url.pathname.substring(url.pathname.lastIndexOf('/')+1);
console.log(pathname);

const container = document.getElementById("scene");

const scene = new Scene(container, pathname)

scene.addEventListener("navigate", (event)=>{
    window.location.href =  event.name, url.origin + "/" + event.name;
})
