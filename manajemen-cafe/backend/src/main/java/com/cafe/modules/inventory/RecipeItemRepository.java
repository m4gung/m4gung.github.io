package com.cafe.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeItemRepository extends JpaRepository<RecipeItem, Long> {
    List<RecipeItem> findByRecipeId(Long recipeId);
    List<RecipeItem> findByIngredientId(Long ingredientId);
}
