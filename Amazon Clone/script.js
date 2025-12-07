document.getElementById("topBtn").onclick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
};
const input = document.querySelector('.search-input');
input.addEventListener("input", () => {
  console.log(input.value);
});
window.addEventListener("scroll", () => {
  document.querySelector(".navbar").classList.toggle("shadow", window.scrollY > 0);
});
