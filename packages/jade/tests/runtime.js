Tinytest.add('Jade - Runtime template insertion', function (test) {
  test.isNotNull(document.querySelector('#myUniqueJadeIdentifier pre',
    "it should insert a pre tag inside the body"));
});

Tinytest.add('Jade - Runtime unwrapped template insertion', function (test) {
  test.isNotNull(document.querySelector('#UnwrappedTemplateUniqueIdentifier img',
    "it should insert an img tag inside the body"));
});

Tinytest.add('Jade - Body attributes', function (test) {
  test.equal(document.body.dataset.test, 'value');
});
