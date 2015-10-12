Template.registerHelper("name", numeral => "Name " + numeral);

Template.registerHelper("person", (name, kw) => {
  let intro = "Hi, my name is " + name;

  if (kw && kw.hash)
    intro += " and my favorite color is " + kw.hash.color;

  return intro;
});

Template.registerHelper("isNonEmpty", function (arg) {
  return _.isString(arg) && !!arg;
});
