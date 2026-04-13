package com.horizons.depsortfix;

import com.google.common.collect.Multimap;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Overwrite;

import java.util.ArrayDeque;
import java.util.Collection;
import java.util.Deque;
import java.util.HashSet;
import java.util.Set;

import net.minecraft.util.DependencySorter;

/**
 * Fixes StackOverflowError in DependencySorter.isCyclic caused by
 * missing visited-set in the vanilla recursive implementation.
 *
 * The vanilla method recurses through the dependency graph without
 * tracking visited nodes, causing exponential blowup on diamond-shaped
 * graphs and infinite recursion on any existing cycles.
 *
 * This replaces the recursive method with an iterative BFS that uses
 * a visited set to avoid re-exploring nodes.
 */
@Mixin(DependencySorter.class)
public class DependencySorterMixin {

    /**
     * @author Project Horizons
     * @reason Fix StackOverflowError - vanilla isCyclic lacks visited set
     */
    @Overwrite
    private static <K> boolean isCyclic(Multimap<K, K> dependencies, K target, K current) {
        // Iterative BFS with visited set replaces naive recursion
        Set<K> visited = new HashSet<>();
        Deque<K> queue = new ArrayDeque<>();
        queue.add(current);

        while (!queue.isEmpty()) {
            K node = queue.poll();
            Collection<K> deps = dependencies.get(node);

            if (deps.contains(target)) {
                return true;
            }

            for (K dep : deps) {
                if (visited.add(dep)) {
                    queue.add(dep);
                }
            }
        }

        return false;
    }
}
