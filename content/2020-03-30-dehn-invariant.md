Title: The Dehn Invariant, or, Tangrams In Space
Date: 2020-03-30
Tags: geometry

{% import 'macros.html' as macros %}

<!-- TODO: I use these 3 a lot; can i consolidate it in one place? -->
{% call macros.mathdef() %}
\newcommand{\ZZ}{\Bbb Z}
\newcommand{\QQ}{\Bbb Q}
\newcommand{\RR}{\Bbb R}
{% endcall %}

Fans of wooden children's toys may remember [tangrams](https://en.wikipedia.org/wiki/Tangram), a puzzle composed of 7 flat pieces that can be rearranged into numerous different configurations.

![Tangrams in square and cat configurations](/images/dehn/tangrams.svg)

As mathematicians, we're interested in shapes that are slightly simpler than cats or houses.
<!-- more -->
For example, we might try to design a set of tangrams that can be rearranged into an equilateral triangle. One possibility is shown below.

![Equidecomposition of square and triangle](/images/dehn/square-to-triangle.svg)

How about a pentagon?

![Equidecomposition of square and pentagon](/images/dehn/square-to-pentagon.svg)

We don't have to start with a square, how about a set that can become a star or a triangle?

![Equidecomposition of six-pointed star and triangle](/images/dehn/star-to-triangle.svg)

What pairs of polygons can we design tangram sets for? One way to reframe this problem is in terms of _scissors-congruence_, which is pretty much what it sounds like. Two polygons are "scissors-congruent" if we can take the first polygon, make a finite number of straight-line cuts to it, and rearrange the pieces into the second polygon. Clearly, two polygons are scissors-congruent if and only if we can design a set of tangrams that connect the two.

---

Given two polygons, how can we tell if they're scissors-congruent? One thing we can do is check their areas, since, if they have different areas, there's no way they can be scissors-congruent. It turns out that this is the _only_ obstacle -- if two polygons have the same area, they _must_ be scissors-congruent! This surprising result is known as the Wallace–Bolyai–Gerwien theorem, and was proven in the 1830s. We'll walk through a proof.

It suffices to show that any polygon of area $A$ is scissors-congruent to an $A \times 1$ rectangle. This is because, if $P_1$ and $P_2$ are scissors-congruent to some third shape $Q$, then we can rearrange $P_1$ into $P_2$ by going through $Q$ as an intermediate step. We start by breaking our polygon into triangles:

![Triangulation of a polygon](/images/dehn/wbg-1.svg)

Next, we'll transform each triangle into a rectangle, by cutting it halfway up its height, and folding down the apex:

![Cutting a triangle into a rectangle](/images/dehn/wbg-2.svg)

Now we need to change the dimensions of this rectangle, but this step requires some creativity. We need the height of the rectangle to be between $1$ and $2$. If it isn't, we can repeatedly cut it in half until it does. (If the height is less than $1$, then we run this process in reverse to double it instead.)

![Repeatedly halving a rectangle](/images/dehn/wbg-3.svg)

Then, we do a sliding maneuver to convert this rectangle into one with height $1$. Notice that we need $u < 1$, or else $u \ell$ would be greater than $\ell$, and we couldn't draw this diagram.

![Minor width adjustment of a rectangle](/images/dehn/wbg-4.svg)

After doing this to all the triangles, the final step is to glue all these rectangles together, end-to-end, to get the desired $A \times 1$ rectangle.

---

The natural question to ask next is: can we generalize this? What about 3D shapes? Are any two polyhedra of equal volume also scissors-congruent?

This is the third of [Hilbert's twenty-three problems](https://en.wikipedia.org/wiki/Hilbert%27s_problems), and his student, Max Dehn, proved in 1903 that, unlike in two dimensions, the answer is "no". He did so by constructing a quantity (now known as the "Dehn invariant") that stays unchanged under scissors-congruence. Two shapes with different Dehn invariants, therefore, cannot be scissors-congruent. For example, a cube and a tetrahedron of equal volume are not scissors-congruent.

Unlike area and volume, the Dehn invariant isn't as simple as a real number, and we'll need to do a bit of legwork to define it. The key observation to make is that a cut can only do one of three things to an edge:

* miss it completely
* cut it at a point
* split it along its entire length

By looking at what these operations do to edges, we can cobble together a quantity that stays invariant. The properties of an edge that we care about are its length and its dihedral angle.[ref]The dihedral angle of an edge is the angle between the two faces adjacent to it. You can think of it as a measure of the 'sharpness' of an edge; a 90° edge is like the edge of a countertop, but a 15° edge will cut like a knife.[/ref]

In the first situation, the edge stays unchanged. That one's easy.

In the second situation, one edge is turned into two edges. The new edges have the same dihedral angle as the original, and their lengths sum to the original length.

![Cutting an edge transversely](/images/dehn/edge-cut-transverse.svg)

In the third situation, we again get two edges, but this time, the length stays the same, and the dihedral angle changes.

![Cutting an edge along its length](/images/dehn/edge-cut-lengthwise.svg)

Lastly, cuts also create new edges, as they slice through a face. We'd like these to count for nothing, count as zero.

Now that we know what cuts do to edges, how do we use this to define an invariant? If an edge is represented by the ordered pair $(\ell_i, \theta_i)$, we want to enforce the following equivalence relations: 
$$ (\ell_1 + \ell_2, \theta) \cong (\ell_1, \theta) + (\ell_2, \theta) \qquad (\ell, \theta_1 + \theta_2) \cong (\ell, \theta_1) + (\ell, \theta_2) $$

These two rules imply some further relations. Consider the sum of $n$ copies of $(\ell, \theta)$. Applying the first rule repeatedly gives $(n \ell, \theta)$, and the second rule gives $(\ell, n \theta)$. This can be extended to negative $n$ as well, so for any integer $n$,
$$ n (\ell, \theta) = (n \ell, \theta) = (\ell, n \theta) $$

If you're familiar with tensors, you might notice that these are exactly the conditions for a tensor product! If not, don't worry, you can think of these as ordered pairs still, but we'll use the symbol $\otimes$ instead of a comma. It may make more sense when we go through the examples.

We still have to deal with the new edges created from cuts in the faces, but these almost resolve themselves. The edges we create come in pairs with supplementary angles. So if the edge pair we create has length $\ell$, we get $(\ell, \theta) + (\ell, \pi - \theta) = (\ell, \pi)$. Using the third rule above, we can drag a $2$ from the left to the right, giving us $(\ell/2, 2\pi)$. If we declare that $2\pi$ is equivalent to $0$ (a reasonable demand, given that we're working with angles), then these edge pairs automatically cancel each other out, as desired.

We can now define the Dehn invariant: it takes values in $\RR \otimes_\ZZ \RR/2 \pi$ (lengths and angles), and it's equal to the sum of $\ell_i \otimes \theta_i$ over all the edges. Is something that concise truly unchanged by scissors-congruence?

When we make a cut, either it misses an existing edge, and so the corresponding term in the sum does not change, or it intersects it, in which case that term is replaced by two terms that sum to the original. It also creates new edges, by cutting into the faces. But as we saw earlier, these edges come in pairs that sum to zero, and so the total value of the invariant remains unchanged.

---

Armed with this invariant, we can now answer the question: are the cube and the tetrahedron are scissors-congruent? Let's say both have volume 1. The cube has 12 edges, each with dihedral angle $\pi / 2$. To get the volume to be $1$, we need edges of length $1$, so the Dehn invariant of this cube is:
$$ 12 (1 \otimes \frac{\pi}{2}) = 3 (1 \otimes 2 \pi) = (3 \otimes 2 \pi) = 0 $$

A tetrahedron has 6 edges, each with dihedral angle $\arccos(1/3)$. The volume of a tetrahedron with side length $a$ is $a^3 / 6 \sqrt 2$, so the side length of our tetrahedron needs to be $a = (72)^{1/6}$, making the Dehn invariant equal to:
$$ 6 (a \otimes \arccos(1/3)) = 6 a \otimes \arccos(1/3) $$

With some knowledge of modules, one can show that this is non-zero,
[ref]First, note that for any rational $p/q$, we have $\ell \otimes \frac{p}{q} \pi = \frac{\ell}{2q} \otimes 2 p \pi = 0$. This means that $\RR \otimes_\ZZ \RR/2\pi \cong \RR \otimes_\ZZ \RR/(2\pi\QQ)$. Since both of those modules are divisible, this is equal to $\RR \otimes_\QQ \RR/(2 \pi \QQ)$, which, being a tensor product of $\QQ$-vector spaces, is a $\QQ$-vector space itself. In particular, if $\ell \ne 0$ and $\theta \notin 2 \pi \QQ$, then $\ell \otimes \theta$ is a non-zero vector.[/ref]
but the crux of the idea is that $\arccos(1/3)$ is not a rational multiple of $\pi$, so we can never get the right hand side of this tensor to collapse to zero. This shows that no matter how many pieces you cut it into, a cube can never be reassembled into a tetrahedron.

One interesting consequence of this: in geometry class, you probably saw some cut-and-paste constructions for proving the area of a parallelogram, or a triangle. This result shows there can never be such a proof for pyramids -- calculus is unavoidable!

---

A final note: we've shown that there are at least two obstructions for two scissors-congruence in 3D: volume and Dehn invariant. Are they the only ones? The answer is yes! In other words, if two polyhedra do have the same volume and Dehn invariant, then they are indeed scissors-congruent. The proof of that is much harder, and a good presentation can be found [here](http://www.math.brown.edu/~res/MathNotes/jessen.pdf). 
