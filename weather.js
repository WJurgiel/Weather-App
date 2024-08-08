function locate(){
    console.log("ooh my god");
}
document.getElementById("day-humidity-indicator").disabled = true;
const slider = document.getElementById("day-humidity-indicator");
slider.addEventListener("change", (event)=>{
    console.log(document.getElementById("day-humidity-indicator").value);
})