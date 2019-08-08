var Weather = function(name, sightAffect, move_cost, damage, _aniW, _aniH)
{
	let sheetAni = Animations.Retrieve(name),
		particleAni = Animations.Retrieve(name+" Particles");
	if(_aniW==null)
		_aniW = sheetAni.Width;
	if(_aniH==null)
		_aniH = sheetAni.Height;
	let particleInterval;
	this.Move_Cost = function(unit, tile)
	{	// calculate the move cost change for this tile
		return (move_cost==null) ? 1 : move_cost;
	};
	this.Damage = function(attackType)
	{
		return (damage==null) ? 1 : damage(attackType);
	};
	this.Start = function(interface)
	{
		if(_aniW==null)
			_aniW = sheetAni.Width;
		if(_aniH==null)
			_aniH = sheetAni.Height;
		if(sightAffect!=null)
		{
			let u,amt = interface.Game.Unit_Amount();
			for(let i=0;i<amt;i++)
			{
				u = interface.Game.Get_Unit(i);
				u.Sight-=sightAffect;
			}
			interface.Game.Player_Visibility();
		}

		if(interface==Fast_Fake_Interface)return;

		for(let x=0;x<interface.gameWidth;x+=_aniW)
		for(let y=0;y<interface.gameHeight;y+=_aniH)
		{
			sheetAni.New(weatherCanvas,x,y,_aniW,_aniH,true);
		}
		particleInterval = setInterval(function(){
			let x = Math.floor(Math.random()*interface.gameWidth),
				y = Math.floor(Math.random()*interface.gameHeight);
			particleAni.New(hudCanvas,x,y,null,null,true);
			particleAni.Stop = false;
		}, 450*particleAni.Delay());
		sheetAni.Stop = false;
		particleAni.Stop = false;
	};
	this.Stop = function(interface)
	{
		clearInterval(particleInterval);
		particleAni.Remove_All();
		sheetAni.Remove_All();
		sheetAni.Stop = true;
		particleAni.Stop = true;
		if(sightAffect!=null)
		{
			let u,amt = interface.Game.Unit_Amount();
			for(let i=0;i<amt;i++)
			{
				u = interface.Game.Get_Unit(i);
				u.Sight+=sightAffect;
			}
		}
		weatherCanvas.clearRect(0, 0, interface.gameWidth, interface.gameHeight);
	};
};

Weather_Data.Normal = {
	Move_Cost:function(){return 1;},
	Damage:function(){return 1;},
	Start:function(interface){
		interface.Game.Player_Visibility();
	},
	Stop:function(){}
};
Weather_Data.Normal.Icon = Images.Retrieve("Sunny Icon");
Weather_Data.Rain = new Weather("Rain", 1, 1.15, function(type){
	return (type==2) ? .5 : 1;
});
Weather_Data.Rain.Icon = Images.Retrieve("Rainy Icon");
Weather_Data.Snow = new Weather("Snow", 2, 1.5, function(type){
	return (type==0) ? .5 : 1;
}, TILESIZE*4, TILESIZE*4);
Weather_Data.Snow.Icon = Images.Retrieve("Snowy Icon");
Weather_Data.Heat = new Weather("Heat Wave", 2, 1, function(type){
	return (type==2) ? 1.5 : 1;
}, TILESIZE*4, TILESIZE*4);
Weather_Data.Heat.Icon = Images.Retrieve("Heat Icon");
Weather_Data.Get_Global = function(index)
{
	if(index==0)
		return Weather_Data.Normal;
	if(index==1)
		return Weather_Data.Rain;
	if(index==2)
		return Weather_Data.Snow;
	if(index==3)
		return Weather_Data.Heat;
};
Weather_Data.Global_Amount = 4;
Weather_Data.GlobalToStr = ["Fog","Rain","Snow"];
