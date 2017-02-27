;(function($){
	
	/*获取浏览器前缀*/
	var _prefix=(function(temp){
		var aPrefix=["webkit","Moz","o","ms"],
			props="";
		for (var i in aPrefix) {
			props=aPrefix[i]+"transition";
			if(temp.style[props]!=undefined){
				return "-"+aPrefix[i].toLowerCase()+"-";
			}
		}
		return false;
	})(document.createElement(PageSwitch))/*实参*/
	
	var PageSwitch=(function(){
		
		/*构造函数*/
		function PageSwitch(element,options){
			/*$.extend() 为jQuery拓展  增加类的新的方法*/
			/*jQuery.fn = jQuery.prototype.*/
			this.settings = $.extend(true, $.fn.PageSwitch.defaults, options||{});
			this.element = element;
			this.init();
		}
		
		PageSwitch.prototype={
			/*初始化插件*/
			/*初始化DOM结构，布局，分页及绑定事件*/
			init : function(){
				var me = this;
				me.selectors = me.settings.selectors;
//				console.log(PageSwitch);
				me.sections = me.element.find(me.selectors.sections);
				me.section = me.sections.find(me.selectors.section);

				me.direction = me.settings.direction == "vertical" ? true : false;
				me.pagesCount = me.pagesCount();
				me.index = (me.settings.index >= 0 && me.settings.index < me.pagesCount) ? me.settings.index : 0;

				me.canscroll = true;

				if(!me.direction || me.index){
					me._initLayout();
				}

				if(me.settings.pagination){
					me._initPaging();
				}

				me._initEvent();
			},
			/*获取滑动页面数量*/
			pagesCount:function(){
				return this.section.length;
			},
			/*获取滑动的宽度（横屏滑动）或者高度（竖屏滑动）*/
			switchLength : function(){
				return this.direction ? this.element.height() : this.element.width();
			},
			/*向上滑动即上一页*/
			prve:function(){
				var me=this;
				if(me.index>0){
					me.index--;
				}else if(me.settings.loop){
					me.index=me.pagesCount-1;
				}
				me._scrollPage();
			},
			/*向后滑动即下一页*/
			next : function(){
				var me=this;
				if(me.index<me.pagesCount-1){
					me.index++;
				}else if(me.settings.loop){
					me.index=0;
				}
				me._scrollPage();
			},
			/*针对横屏情况进行页面布局*/
			_initLayout:function(){
				var me=this;
				if(!me.direction){
					var width=(me.pagesCount*100)+"%",
						cellWidth=(100/me.pagesCount).toFixed(2)+"%";
					me.sections.width(width);
					me.section.width(cellWidth).css("float","left");
				}
				if(me.index){
					me._scrollPage(true);
				}
			},
			/*横屏的分页*/
			_initPaging : function(){
				var me = this,
					pagesClass = me.selectors.page.substring(1);
				me.activeClass = me.selectors.active.substring(1);

				var pageHtml = "<ul class="+pagesClass+">";
				for(var i = 0 ; i < me.pagesCount; i++){
					pageHtml += "<li></li>";
				}
				me.element.append(pageHtml);
				var pages = me.element.find(me.selectors.page);
				me.pageItem = pages.find("li");
				me.pageItem.eq(me.index).addClass(me.activeClass);

				if(me.direction){
					pages.addClass("vertical");
				}else{
					pages.addClass("horizontal");
				}
			},
			/*初始化插件事件*/
			_initEvent:function(e){
				var me=this;
				/*绑定事件滚轮事件*/
				/*FireFox浏览器一个人使用DOMMouseScroll*/
				me.element.on("mousewheel DOMMouseScroll",function(e){
					e.preventDefault();
					/*判断鼠标滚轮向上还是向下，Firefox与其他的相反，所以要去负值*/
					var delta=e.originalEvent.wheelDelta||-e.originalEvent.wheelDelta;
					if(me.canscroll){
						if(delta>0&&(me.index&&!me.settings.loop||me.settings.loop)){
							me.prve();
						}else if(delta<0&&(me.index<(me.pagesCount-1)&&!me.settings.loop||me.settings.loop)){
							me.next();
						}
					}
				});
				
				/*绑定分页click事件*/
				me.element.on("click",me.selectors.page+" li",function(){
					me.index=$(this).index();
					me._scrollPage();
				});
				
				if(me.settings.keyboard){
					$(window).keydown(function(e){
						var keyCode=e.keyCode;
						if(keyCode==37||keyCode==38){
							me.prve();
						}else if(keyCode==39||keyCode==40){
							me.next();
						}
					})
				}
				
				/*绑定窗口改变事件*/
				/*为了不频繁调用resize的回调方法，做了延迟*/
				var resizeId;
				$(window).resize(function(){
					clearTimeout(resizeId);
					resizeId=setTimeout(function(){
						var currentLength=me.switchLength();
						var offset=me.settings.direction?me.section.eq(me.index).offset().top:me.section.eq(me.index).offset().left;
						if(Math.abs(offset)>currentLength/2&&me.index<(me.pagesCount-1)){
							me.index++;
						}
						if(me.index){
							me._scrollPage();
						}
					},500)
				})
				
				/*支持css3的浏览器，绑定transitionend事件（动画完后的回调函数）*/
				if(_prefix){
					me.sections.on("transitionend webktitTransitionEnd oTransitionEnd otransitionend",function(){
						me.canscroll=true;
						if(me.settings.callback&& $.type(me.settings.callback)==="function"){
							me.settings.callback();
						}
					})
				}
			},
	
			/*滑动动画*/
			_scrollPage:function(init){
				var me=this;
				var dest=me.section.eq(me.index).position();
				if(!dest) return;
				
				me.canscroll==false;
				if(_prefix){
					var translate=me.direction?"translateY(-"+dest.top+"px)":"translateX(-"+dest.left+"px)";
					me.sections.css(_prefix+"transitoin","all"+me.settings.duration+"ms"+me.settings.easing);
					me.sections.css(_prefix+"transform",translate);
				}else{
					var animateCss=me.direction?{top:-dest.top}:{left:-dest.left};
					me.sections.animate(animateCss,me.settings.duration,function(){
						me.canscroll=true;
						if(me.settings.callback){
							me.settings.callback();
						}
					})
				}
				if(me.settings.pagination&&!init){
					/*查找每个 p 元素的所有类名为 "selected" 的所有同胞元素：
                    $("p").siblings(".selected")*/
					me.pageItem.eq(me.index).addClass(me.activeClass).siblings("li").removeClass(me.activeClass);
				}
			}
		}
		return PageSwitch;
	})();
	/*单例模式
	 只生成一个实例，可以避免过多的实例不好管理*/
	$.fn.PageSwitch = function(options){
		return this.each(function(){
			var me = $(this),
				instance = me.data("PageSwitch");

			if(!instance){
				me.data("PageSwitch", (instance = new PageSwitch(me, options)));
			}

			if($.type(options) === "string") return instance[options]();
		});
	};
	
	$.fn.PageSwitch.defaults = {
		selectors : {
			sections : ".sections",
			section : ".section",
			page : ".pages",
			active : ".active",
		},
		index : 0,		//页面开始的索引
		easing : "ease",		//动画效果
		duration : 500,		//动画执行时间
		loop : false,		//是否循环切换
		pagination : true,		//是否进行分页
		keyboard : true,		//是否触发键盘事件
		direction : "horizontal",		//滑动方向vertical,horizontal
		callback : ""		//回调函数
	};
	
	$(function(){
		$('[data-PageSwitch]').PageSwitch();
	});
	
})(jQuery)
