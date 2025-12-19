const btn = document.querySelector('#clickMe');
const display = document.querySelector('.displayNum');
let count = 0;


function increseNum(){
    display.innerHTML = `<p>${count}</p>`;
    // console.log(count);
};
increseNum();

btn.addEventListener('click', function(e){
    count++;
    increseNum();   
});