
// Array를 무작위로 섞어줌. 동작은 분석해봐야 함.
Array.prototype.shuffle = function(){
  return this.concat().sort(
    function(){return Math.random() - Math.random();}
  );
}

// chrome.bookmark로 북마크 폴더들을 불러오기
function getBookmark_folders(){
  return new Promise(function(resolve, reject){
    chrome.bookmarks.getTree(function(bookmarkTreeNodes){
      var temp_select_list = $('<select id="bookmark-folder">');
      var folder_list = traverseBookmarks(bookmarkTreeNodes, temp_select_list);
      $(".bookmark-folders").append(folder_list);
      resolve()
    })
  });
}

// chrome.storage.sync를 통해 Cache로 저장되어있던 bookmark_folder 정보를 가져오고,
// bookmark-contents에 해당 bookmark_folder에 있는 링크들을 dump 함.
function get_choosen_folder(){
  return new Promise(function(resolve, reject){
    chrome.storage.sync.get((data)=>{
      resolve(data.bookmark_folder);
      $('#bookmark-folder option[value=' + data.bookmark_folder + ']').prop("selected", true);
    })
  });
}

// bookmark-folder가 바뀔 때마다 내용을 변경하는 이벤트 적용.
function add_bookmark_folder_change(){
  $('.bookmark-folders').change(function () {
    $('.bookmark-contents').empty();
    dumpBookmarks($("#bookmark-folder option:selected").val());

    chrome.storage.sync.set({
      "bookmark_folder": $("#bookmark-folder option:selected").val()
    });
  });
}


// bookmark에서 폴더만 option에 넣고 select 객체로 반환
function traverseBookmarks(bookmarkTreeNodes, temp_select_list) {
  for(var bookmarkNode of bookmarkTreeNodes) {
    if(bookmarkNode.children) {
      if(bookmarkNode.title != ""){
        var option = $('<option>');
        option.attr("value", bookmarkNode.title);
        option.text(bookmarkNode.title);
        temp_select_list.append(option);
      }
      traverseBookmarks(bookmarkNode.children, temp_select_list);
    } 
  }
  return temp_select_list
}


function dumpBookmarks(query) {
  chrome.bookmarks.getTree(
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


// 폴더로 select 객체를 채움.
function main(){
  getBookmark_folders().then(get_choosen_folder).then(dumpBookmarks);
  add_bookmark_folder_change();
}

document.addEventListener('DOMContentLoaded', function () {
  $('.bookmark-contents').empty();
  main();
});
