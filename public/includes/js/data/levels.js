var Levels_Class = function()
{
	let unlocked_levels = 1;
	let LevelData = {
		Name:["First Test", "Second Test", "End Of The World"],
		Map:[
			"¥¦¤«¨bbm¡R¡RR|§ mcbmcbmclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclcljljljljljljljlcljlclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclmlt§lme^i^d^cle^d^d^blmj^c^d^blj^b^f^blj^g^i^_clj^e^i^_clj^e^k^_clj^g^k^_clj^j^c^clj^k^e^cld^i^d^clg^b^c^blg^c^b^bld^d^c^blg^k^c^clg^j^b^clmbmm",
			"¥¦¤«¨bbm¡R¡RR|§ mcbmcbmclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclcljljljljljljljlcljlclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclmlt§lme^i^d^cle^d^d^blmj^c^d^blj^b^f^blj^g^i^_clj^e^i^_clj^e^k^_clj^g^k^_clj^j^c^clj^k^e^cld^i^d^clg^b^c^blg^c^b^bld^d^c^blg^k^c^clg^j^b^clmbmm",
			"¥¦¤«¨bbm¡R¡RR|§ mcbmcbmclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclcljljljljljljljlcljlclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclclmlt§lme^i^d^cle^d^d^blmj^c^d^blj^b^f^blj^g^i^_clj^e^i^_clj^e^k^_clj^g^k^_clj^j^c^clj^k^e^cld^i^d^clg^b^c^blg^c^b^bld^d^c^blg^k^c^clg^j^b^clmbmm"
		],
		id:[1100, 1101, 1102]
	};

	this.Report_Unlocked = function(amt)
	{
		console.log("SOMETHING IN HERE",amt);
		unlocked_levels = amt;
	};

	this.Name = function(lvl)
	{
		if(lvl>unlocked_levels || lvl<0)
			return "Nah";
		return LevelData.Name[lvl];
	};
	this.Data = function(lvl)
	{
		if(lvl>unlocked_levels || lvl<0)
			return;
			return LevelData.Map[lvl];
	};
	this.Unlocked = function(num)
	{
		return (num<=unlocked_levels);
	};
	this.Current = function()
	{
		return unlocked_levels;
	};
	this.Unlock_Next = function()
	{
		return ++unlocked_levels;
	};
};
var Levels = new Levels_Class();
