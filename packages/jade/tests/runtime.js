Tinytest.add('Jade - Runtime template insertion', function (test) {
  test.isNotNull(document.querySelector('#myUniqueJadeIdentifier pre',
    "it should insert a pre tag inside the body"));
});
