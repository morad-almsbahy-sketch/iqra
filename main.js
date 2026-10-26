/* Entry point. */
(function () {
  RF.initShop();
  RF.initReader();
  RF.initShelf();
  RF.initPages();
  var hash = location.hash.replace("#", "");
  if (hash === "library") RF.show("library");
})();
