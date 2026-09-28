using Gastos.Domain.Categories;

namespace Gastos.UnitTests.Domain;

public class CategoryRulesTests
{
    [Theory]
    [InlineData("red")]
    [InlineData("#12345")]
    [InlineData("#GGGGGG")]
    public void Rechaza_colores_que_no_son_hexadecimales(string color) =>
        Assert.Contains("color", CategoryRules.Validate("Nueva", color).Keys);

    [Fact]
    public void Rechaza_nombre_vacio_o_muy_largo()
    {
        Assert.Contains("name", CategoryRules.Validate(" ", "#123456").Keys);
        Assert.Contains("name", CategoryRules.Validate(new string('x', 41), "#123456").Keys);
    }

    [Fact]
    public void Create_normaliza_nombre_y_color()
    {
        var category = Category.Create("c1", "  Mascotas ", "#AABBCC", DateTime.UnixEpoch).Value;

        Assert.Equal("Mascotas", category.Name);
        Assert.Equal("#aabbcc", category.Color);
    }

    [Fact]
    public void SameName_ignora_mayusculas_y_espacios() =>
        Assert.True(CategoryRules.SameName(" transporte ", "Transporte"));
}
