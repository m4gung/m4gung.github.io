package com.cafe.modules.inventory;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "recipe_items")
public class RecipeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    public RecipeItem() {}

    public RecipeItem(Recipe recipe, Ingredient ingredient, BigDecimal quantity) {
        this.recipe = recipe;
        this.ingredient = ingredient;
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Recipe getRecipe() { return recipe; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }

    public Ingredient getIngredient() { return ingredient; }
    public void setIngredient(Ingredient ingredient) { this.ingredient = ingredient; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
}
