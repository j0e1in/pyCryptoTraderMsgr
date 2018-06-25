var a = '123123';


console.log(test(a));

function test(a){
	var b = ['123123123325', '123123'];
	b.forEach(e => {
	if (e === a)
		return 1;
	else
		return 0;
	})
}
