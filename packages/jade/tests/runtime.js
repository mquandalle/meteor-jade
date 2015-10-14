Tinytest.add('Jade - Head inclusion', function (test) {
  test.equal($('meta[name=jadetest]').attr('content'), '1337');
});

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

Tinytest.add('Jade - Complex function execution', function (test) {
  test.equal($('#otherUnique').text(),
    "Evaluated content: 15");
});

Tinytest.add('Jade - Template evaluated function execution', function (test) {
  test.equal($('#myUniqueJadeIdentifier #templateEval').text(),
    "5");
});

Tinytest.add('Jade - Template child evaluated function execution', function (test) {
  test.equal($('#myUniqueJadeIdentifier #templateChildEval').text(),
    "3");
});

Tinytest.add('Jade - Inline evaluated function execution', function (test) {
  test.equal($('#inlineEval').attr('content'),
    "c6");
});

Tinytest.add('Jade - If eval test', function (test) {
  test.equal($('#ifEvalTest').text(),
    "9\n12");
});
