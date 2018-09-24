---
layout: post
title: Monsky's Theorem
use_math: true
---
<div style="display: none;">
$\newcommand{\RR}{\Bbb R}
\newcommand{\QQ}{\Bbb Q}
\newcommand{\abs}[1]{|{#1}|_2}$
</div>

For which $n$ can you cut a square into $n$ triangles of equal area?

This question appears quite simple; it could have been posed to the Ancient Greeks. But like many good puzzles, it is a remarkably stubborn one.

It was first solved in 1970, by Paul Monsky. Despite the completely geometric nature of the question, his proof relies primarily on number theory and combinatorics! Despite the level of machinery involved, his proof is quite accessible, and we will describe it below.

<!--more-->

---

If you have a napkin on hand, it should be straightforward to come up with a solution for $n = 2$ and $4$. A little more thought should yield solutions for any even $n$. One such scheme is depicted below:

TODO diagram

But when $n$ is odd, you will have considerably more trouble. Monsky's theorem states that such a task is, in fact, impossible.

Monsky's Theorem: The unit square cannot be dissected into an odd number of triangles of equal area. TODO theorem-box

The result clearly extends to squares of any size, and in fact, arbitrary parallelograms.

There are two key ingredients here:
1. Sperner's Lemma
2. 2-adic valuations

Proof sketch:
* Color the vertices of the dissection using three colors
* Find a triangle with exactly one vertex of each color
* Show that such a triangle cannot have area $1/n$

If the last step seems ridiculous to you, don't worry. It's completely non-obvious that the coloring of a triangle's vertices could at all be related to its area. But once you see the trick, it will (hopefully) seem less mysterious. Just hang in there.


# Sperner's Lemma

Consider a polygon $P$ in the plane, and some dissection of it into triangles $T_i$. As promised in the previous section, color the vertices with three colors; we'll use red, green, and blue. We will call a segment **purple** if it has one red and one blue endpoint. A triangle with exactly one corner of each color will be called **trichromatic**. (Great terminology, eh?)

A **Sperner coloring** is a coloring of the vertices of $T_i$, using three colors, with the following properties:
* no face of $P$, nor any face of one of the $T_i$, contains vertices of all three colors
* there are an odd number of purple segments on the boundary of $P$

For example, the following are Sperner colorings:

TODO diagram

But these are not:

TODO diagram

In this format, Sperner's lemma can be stated as:

Sperner's Lemma: Given a Sperner coloring of $(P, T_i)$, there is at least one trichromatic triangle. TODO theorem-box

*Proof*: First, we establish a lemma: a triangle $T$ is trichromatic iff its faces have an odd number of purple segments.

This is because, if we delete vertices lying on the faces of $T$, it won't change whether the number of purple segments is even or odd. And of course, since we're not touching the corners, it can't change whether $T$ is trichromatic or not. This relies on the first property of Sperner colorings: that no face can use all three colors. If the face contains green at all, then it can't ever have purple segments, as it must omit either red or blue vertices. The remaining cases are shown below:

TODO diagram

Thus, we can reduce to the case where $T$ has no vertices lying on its faces. But from here, the casework is easy: a trichromatic triangle has exactly one purple segment, and otherwise, it has zero or two.

---

Cool. How does this help us?

Let's do some counting mod $2$. Let $f(T)$ be the number of purple segments in a triangle $T$. What is the sum of all $f(T)$, mod $2$?

On one hand, it's simply the number of trichromatic triangles; $f(T) \not\equiv 0 \pmod 2$ exactly when $T$ is trichromatic. But also, it's the number of purple segments on the boundary. Each purple segment in the interior of $P$ gets counted twice, and so contributes nothing, but boundary segments contribute exactly once.

Since there are an odd number of purple segments on the boundary of $P$, there are an odd number of trichromatic triangles. In particular, there's at least one of them.

(This illustrates a common trick among combinatorialists: if you want to show that an object $X$ exists, show that the number of $X$s is odd. Cheeky!)

# $2$-adic valuations

Before we describe our coloring, we'll take an unexpected detour into the land of valuations.

A **valuation** is a way of defining the size of a number. More concretely, a valuation on a ring $R$ is a function $\| \cdot \|$ from $R$ to the non-negative reals such that:
* $\|x\| = 0$ if and only if $x = 0$
* $\|xy\| = \|x\| \cdot \|y\|$
* $\|x + y\| \le \max(\|x\|, \|y\|)$, with equality iff $\|x\| \ne \|y\|$

The last of these is often called the **strong triangle inequality**, since it implies the normal triangle inequality, $\|x + y\| \le \|x\| + \|y\|$.

Together, these imply a property you'd expect from an absolute value: $\| -x \|= \|x\|$. Assume otherwise, that there's some $x$ for which $\|x\| \ne \|-x\|$. Obviously $x \ne 0$, so $\|x\|$ and $\|-x\|$ are both strictly positive. But then the strong triangle inequality tells us that
\\[ 0 = \| 0 \| = \| x + (-x) \| = \max(\|x\|, \|-x\|) \\]

By contradiction, a valuation must always have $\|x\| = \|-x\|$ for all $x$.

---

The particular valuation we're interested in the $2$-adic valuation, which measures how divisible by two a number is. The more $2$s fit into a number, the smaller its valuation is.

Any rational number $q$ can be written in the form $q = 2^n \frac{a}{b}$, where $a$ and $b$ are odd. For nonzero $q$, there is a unique such $n$, and we define $\abs{q}$ to be $(1/2)^n$. If $q = 0$, we declare its valuation to be $0$. (This isn't unreasonable; zero is "infinitely divisible" by two, in some sense.) Some examples to prime your intuition:
\\[ \abs{4} = 1/4 \qquad \abs{3} = 1 \qquad \abs{6} = 1/2 \qquad \abs{3/8} = 8 \qquad \abs{12/5} = 1/4 \\]

We claim this is a valuation. The first property is trivial; we essentially declared it by fiat. The second property is also easy to verify. The third one is worth writing out though. Say $x = 2^n \frac{a}{b}$ and $y = 2^m \frac{c}{d}$, and without loss of generality let $n \ge m$. Then,
\\[ x + y = 2^n \frac{a}{b} + 2^m \frac{c}{d} = 2^m \left( \frac{2^{n-m} a}{b} + \frac{c}{d} \right) = 2^m \frac{2^{n-m} ad + bc}{bd} \\]

The valuation of this can be found from its parts. Note that $bd$ is an odd integer, and so has valuation $1$:
\\[ \abs{x + y} = \abs{2^m} \frac{\abs{2^{n-m} ad + bc}}{\abs{bd}} = (1/2)^m \abs{2^{n-m} ad + bc} \\]

Since $2^{n-m} ad + bc$ is an integer, it has valuation $\le 1$, so $\abs{x + y} \le (1/2)^m$. We get equality exactly when $\abs{2^{n-m} ad + bc} = 1$, i.e., when it is odd. But this occurs exactly when $n > m$. Since $(1/2)^m = \max(\|x\|, \|y\|)$, this demonstrates the third property.

So $\abs{\cdot}$ is an honest-to-god valuation on $\QQ$. By a theorem of Chevalley, we can extend this to a valuation on $\RR$. The details are not particularly important, and the curious reader can find them at the end of this post.


# Coloring The Plane

Our coloring of the dissection will use the (extended) $2$-adic valuation. Our choice of coloring is peculiar enough that it deserves its own section though.

Given a point $(x,y)$ in the plane, we'll color it:
* red if $\abs{x} < 1$ and $\abs{y} < 1$
* green if $\abs{x} \ge 1$ and $\abs{x} \ge \abs{y}$
* blue if $\abs{y} \ge 1$ and $\abs{y} > \abs{x}$

This coloring has some interesting properties, which we'll establish quickly.

Claim: if $P$ is a red point, then $Q$ and $Q-P$ have the same color.

*Proof*: This is a good exercise for the reader. Make use of the fact that, if $\abs{a} < 1$ and $\abs{x} \ge 1$, then $\abs{x - a} \le \max(\abs{x}, \abs{-a}) = \abs{x}$. On the other hand, if $\abs{x} < 1$, then $\abs{x - a} < 1$ as well.

Claim: If we forget the dissection for a second, and pick *any* three collinear points in the plane, they cannot all be different colors.

*Proof*: Let $P_r$, $P_g$, and $P_b$ be three points, colored red, green, and blue, respectively. We must show they can't be collinear; equivalently, the vectors $P_g - P_r$ and $P_b - P_r$ are not parallel. This is a question about linear independence, so we'd better take a determinant. Let $P_g - P_r = (x_g, y_g)$, and $P_b - P_r = (x_b, y_b)$.
\\[
\det M =
\det \begin{pmatrix}
x_g & x_b \\\\\\\\
y_g & y_b
\end{pmatrix}
=
x_g y_b - x_b y_g
\\]

To show that $\det M$ is non-zero, we can show that its $2$-adic valuation is nonzero. This might seem harder, but since the only thing we know about these points is their valuations, it's the only shot we have!

By the previous claim, $P_g - P_r$ is green, and $P_b - P_r$ is blue. From the coloring rules, we then know that $\abs{y_b} > \abs{x_b}$ and $\abs{x_g} \ge \abs{y_g}$. So $\abs{x_g y_b}$ is strictly greater than $\abs{x_b y_g}$. The strong triangle inequality then tells us that $\abs{\det M} = \abs{x_g y_b} \ge 1$. Therefore, $\det M \ne 0$, and so $P_r$, $P_g$, and $P_b$ cannot be collinear.


# Putting it Together

Now we're ready. Let $n$ be odd, and consider a dissection of the unit square into $n$ triangles of equal area.

Using the coloring rule above, we claim we get a Sperner coloring. The time we invested in the previous section pays off handsomely, as both required properties become almost trivial.
* No face of the square, nor of a triangle in the dissection, can contain vertices of all three colors, because no line *anywhere* in the plane can have vertices of all three colors!
* Again, we use the fact that there are no trichromatic lines.  Consider the corners of the square and their colors:
\\[ (0, 0) \textrm{ is red} \qquad (1, 0) \textrm{ is green} \qquad (0, 1) \textrm{ is blue} \qquad (1, 1) \textrm{ is green} \\]
<!--TODO diagram instead?-->
The only segments that could be purple lie between $(0, 0)$ and $(0, 1)$. And because one endpoint is red, and the other blue, there must be an odd number of purple segments. (Remember our exercise about deleting vertices on faces...?)

Therefore, this coloring is a Sperner coloring, and so somewhere, there is a trichromatic triangle. To finish the proof, we must show that this triangle can't have area $1/n$.

Let's revisit our second claim. Strong as it is, we can squeeze just a tiny bit more out of it. Using the same notation as before, basic coordinate geometry tells us that the area of the triangle formed by $P_r$, $P_g$, and $P_b$ is $K = \frac{1}{2} \det M$. By showing that $\det M \ne 0$, we showed that this triangle was not degenerate, i.e., the three points were not collinear. But we actually showed a little more than that; we showed that $\abs{\det M} \ge 1$. Therefore, if a trichromatic triangle has area $K$, then $\abs{K} = \abs{1/2} \abs{\det M} \ge 2$.

But because $n$ is odd, $\abs{1/n} = 1$. Contradiction.


# Appendix

Remember that theorem by Chevalley, TODO explain that.