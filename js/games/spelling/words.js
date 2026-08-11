(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.spellingWords = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var EN = {
    1: [
      { w: "apple", hint: "🍎" }, { w: "dog", hint: "🐶" }, { w: "cat", hint: "🐱" },
      { w: "book", hint: "📖" }, { w: "sun", hint: "☀️" }, { w: "moon", hint: "🌙" },
      { w: "star", hint: "⭐" }, { w: "fish", hint: "🐟" }, { w: "bird", hint: "🐦" },
      { w: "milk", hint: "🥛" }, { w: "egg", hint: "🥚" }, { w: "cake", hint: "🎂" },
      { w: "ball", hint: "⚽" }, { w: "tree", hint: "🌳" }, { w: "car", hint: "🚗" }
    ],
    2: [
      { w: "teacher", hint: "👩‍🏫" }, { w: "school", hint: "🏫" }, { w: "friend", hint: "🤝" },
      { w: "family", hint: "👨‍👩‍👧" }, { w: "water", hint: "💧" }, { w: "bread", hint: "🍞" },
      { w: "mountain", hint: "⛰️" }, { w: "river", hint: "🌊" }, { w: "flower", hint: "🌸" },
      { w: "music", hint: "🎵" }, { w: "doctor", hint: "🩺" }, { w: "animal", hint: "🐾" },
      { w: "garden", hint: "🌿" }, { w: "picture", hint: "🖼️" }, { w: "holiday", hint: "🎉" }
    ],
    3: [
      { w: "beautiful", hint: "💖" }, { w: "science", hint: "🔬" }, { w: "history", hint: "🏛️" },
      { w: "weather", hint: "🌦️" }, { w: "library", hint: "📚" }, { w: "elephant", hint: "🐘" },
      { w: "umbrella", hint: "☂️" }, { w: "rainbow", hint: "🌈" }, { w: "chocolate", hint: "🍫" },
      { w: "dinosaur", hint: "🦕" }, { w: "astronaut", hint: "🚀" }, { w: "computer", hint: "💻" },
      { w: "basketball", hint: "🏀" }, { w: "playground", hint: "🎠" }, { w: "butterfly", hint: "🦋" }
    ]
  };

  var ZH = {
    1: [
      { w: "苹果", hint: "一种红色的水果" }, { w: "小狗", hint: "汪汪叫的动物" },
      { w: "小猫", hint: "会抓老鼠的宠物" }, { w: "书本", hint: "用来学习的物品" },
      { w: "太阳", hint: "白天天空中的星球" }, { w: "月亮", hint: "夜晚天上的星球" },
      { w: "星星", hint: "夜空中的亮点" }, { w: "小鱼", hint: "水里游的动物" },
      { w: "小鸟", hint: "会飞的动物" }, { w: "牛奶", hint: "白色的饮品" },
      { w: "鸡蛋", hint: "鸡下的蛋" }, { w: "蛋糕", hint: "生日时吃的甜点" },
      { w: "足球", hint: "用脚踢的球" }, { w: "大树", hint: "高高的植物" },
      { w: "汽车", hint: "四个轮子的交通工具" }
    ],
    2: [
      { w: "老师", hint: "学校里教你知识的人" }, { w: "学校", hint: "学习的地方" },
      { w: "朋友", hint: "一起玩的好伙伴" }, { w: "家庭", hint: "爸爸妈妈和你" },
      { w: "河流", hint: "流动的水" }, { w: "花朵", hint: "会开花的植物" },
      { w: "音乐", hint: "好听的声音" }, { w: "医生", hint: "看病的人" },
      { w: "动物", hint: "会动的生命" }, { w: "花园", hint: "种花的地方" },
      { w: "天气", hint: "晴雨冷暖" }, { w: "假期", hint: "不用上学的日子" },
      { w: "图书馆", hint: "看书借书的地方" }, { w: "彩虹", hint: "雨后天空的七彩桥" },
      { w: "礼物", hint: "送人的东西" }
    ],
    3: [
      { w: "坚持", hint: "不放弃地做下去" }, { w: "努力", hint: "认真用劲去做" },
      { w: "勇敢", hint: "不怕困难" }, { w: "聪明", hint: "反应很快、很会想" },
      { w: "诚实", hint: "不说谎" }, { w: "谦虚", hint: "不骄傲自满" },
      { w: "认真", hint: "对待事情不马虎" }, { w: "专心", hint: "注意力集中" },
      { w: "团结", hint: "大家一条心" }, { w: "友善", hint: "对人友好和善" },
      { w: "一马当先", hint: "跑在最前面" }, { w: "三心二意", hint: "做事不专心" },
      { w: "画蛇添足", hint: "多此一举" }, { w: "守株待兔", hint: "坐等好运气" },
      { w: "亡羊补牢", hint: "犯错后及时补救" }
    ]
  };

  var EN_ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
  var ZH_DISTRACT = ["大", "小", "中", "上", "下", "左", "右", "天", "地", "人", "山", "水", "火", "木", "金", "土", "日", "月", "风", "雨"];

  function getPool(lang, level) {
    var table = lang === "zh" ? ZH : EN;
    return (table[level] || table[1]).slice();
  }

  return {
    getPool: getPool,
    EN_ALPHABET: EN_ALPHABET,
    ZH_DISTRACT: ZH_DISTRACT
  };
});
