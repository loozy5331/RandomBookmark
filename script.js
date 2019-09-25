
// Array를 무작위로 섞어줌. 동작은 분석해봐야 함.
Array.prototype.shuffle = function(){
  return this.concat().sort(
    function(){return Math.random() - Math.random();}
  );
}

function getBookmarks(){
  return new Promise(function(resolve, reject){
    chrome.bookmarks.getTree(function(bookmarkTreeNodes){
      var temp_select_list = $('<select id="bookmark-folder">');
      var folder_list = traverseBookmarks(bookmarkTreeNodes, temp_select_list);
      $(".bookmark-folders").append(folder_list);
      resolve()
    })
  });
}

function bookmark_change(){
  $('.bookmark-folders').change(function () {
    $('.bookmark-contents').empty();
    dumpBookmarks($("#bookmark-folder option:selected").val());
    chrome.storage.sync.set({
      "bookmark_folder": $("#bookmark-folder option:selected").val()
    });
  });
}

function getCache(){
  return new Promise(function(resolve, reject){
    chrome.storage.sync.get((data)=>{
      resolve(data.bookmark_folder);
      $('#bookmark-folder option[value=' + data.bookmark_folder + ']').prop("selected", true);
    })
  });
}

// 폴더로 select 객체를 채움.
function init_bookmark_folders(){
  getBookmarks().then(getCache).then(dumpBookmarks);
  bookmark_change();
}

// 폴더만 option에 넣고 select 객체로 반환
function traverseBookmarks(bookmarkTreeNodes, temp_select_list) {
  for(var i=0;i<bookmarkTreeNodes.length;i++) {
    if(bookmarkTreeNodes[i].children) {
      if(bookmarkTreeNodes[i].title != ""){
        var option = $('<option>');
        option.attr("value", bookmarkTreeNodes[i].title);
        option.text(bookmarkTreeNodes[i].title);
        temp_select_list.append(option);
      }
      traverseBookmarks(bookmarkTreeNodes[i].children, temp_select_list);
    } 
  }
  return temp_select_list
}

function dumpBookmarks(query) {
  var bookmarkTreeNodes = chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
      dumpTreeNodes(bookmarkTreeNodes, query);
    });
}

function dumpTreeNodes(bookmarkNodes, query) {
  for (var i=0;i < bookmarkNodes.length;++i) {
    if(String(bookmarkNodes[i].title).indexOf(query) != -1){
      chrome.bookmarks.getChildren(bookmarkNodes[i].id, function(childs){
        var list = $('<ul>');
        var temp_list = new Array();
        for(var c=0;c<childs.length;++c){
          var bookmarks = $(".bookmark-contents");
          if(childs[c].url){ // sub-folder는 제외
            //list.append(dumpNode(childs[c]));
            temp_list.push(dumpNode(childs[c]));
          }
          bookmarks.append(list);
        }
        // 섞어줌.
        temp_list = temp_list.shuffle();
        for(var j=0; j<(temp_list.length < 5?temp_list.length: 5);++j){
          list.append(temp_list[j]);
        }
        if(temp_list.length > 0){
          bookmarks.append(list);
        }
      });
    }
    if(bookmarkNodes[i].children && bookmarkNodes[i].children.length > 0){
      dumpTreeNodes(bookmarkNodes[i].children, query);
    }
  }
}

function dumpNode(bookmarkNode){
  var anchor = $('<a>');
  anchor.attr('href', bookmarkNode.url);
  anchor.text(bookmarkNode.title);
  anchor.click(function() {
    chrome.tabs.create({url: bookmarkNode.url});
  });
  var span = $('<span>');
  span.append(anchor);
  var li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
  return li;
}


document.addEventListener('DOMContentLoaded', function () {
  $('.bookmark-contents').empty();
  init_bookmark_folders();
});
