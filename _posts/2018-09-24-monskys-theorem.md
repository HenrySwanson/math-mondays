---
layout: post
title: Monsky's Theorem
use_math: true
---
<div style="display: none;">
$\newcommand{\RR}{\Bbb R}
\newcommand{\QQ}{\Bbb Q}
\newcommand{\ZZ}{\Bbb Z}$
</div>

For which $n$ can you cut a square into $n$ triangles of equal area?

This question appears quite simple; it could have been posed to the Ancient Greeks. But like many good puzzles, it is a remarkably stubborn one.

It was first solved in 1970, by Paul Monsky. Despite the completely geometric nature of the question, his proof relies primarily on number theory and combinatorics! Despite the level of machinery involved, his proof is quite accessible, and we will describe it below.

<!--more-->

---

If you have a napkin on hand, it should be straightforward to come up with a solution for $n = 2$ and $4$. A little more thought should yield solutions for any even $n$. One such scheme is depicted below:

![Equidissection when n is even](/assets/monsky-even.svg){:width="100%" height="auto"}

But when $n$ is odd, you will have considerably more trouble. Monsky's theorem states that such a task is, in fact, impossible.

Monsky's Theorem: The unit square cannot be dissected into an odd number of triangles of equal area. <!--TODO theorem-box-->

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

![Sperner Coloring 1](/assets/monsky-sperner-1.svg){:width="30%" height="auto"}
![Sperner Coloring 2](/assets/monsky-sperner-2.svg){:width="30%" height="auto"}

But these are not -- the first has lines of more than two colors, and the second has an even number of purple boundary segments:

![Non-Sperner Coloring 1](/assets/monsky-sperner-3.svg){:width="30%" height="auto"}
![Non-Sperner Coloring 2](/assets/monsky-sperner-4.svg){:width="30%" height="auto"}

In this format, Sperner's lemma can be stated as:

Sperner's Lemma: Given a Sperner coloring of $(P, T_i)$, there is at least one trichromatic triangle. <!--TODO theorem-box-->

Check the examples above, both Sperner colorings have trichromatic triangles. The first non-Sperner coloring has one, but the other does not.

*Proof*: First, we establish a lemma: a triangle $T$ is trichromatic iff its faces have an odd number of purple segments.

This is because, if we delete vertices lying on the faces of $T$, it won't change whether the number of purple segments is even or odd. And of course, since we're not touching the corners, it can't change whether $T$ is trichromatic or not. This relies on the first property of Sperner colorings: that no face can use all three colors. If the face contains green at all, then it can't ever have purple segments, as it must omit either red or blue vertices. This is also true if the face is monochromatic. The remaining cases are shown below:

![Illustration of the cases](/assets/monsky-delete-purple.svg){:width="100%" height="auto"}

Thus, we can reduce to the case where $T$ has no vertices lying on its faces. But from here, the casework is easy: a trichromatic triangle has exactly one purple segment, and otherwise, it has zero or two.

---

Cool. How does this help us?

Let's do some counting mod $2$. Let $f(T)$ be the number of purple segments in a triangle $T$. What is the sum of all $f(T)$, mod $2$?

On one hand, it's simply the number of trichromatic triangles; $f(T) \not\equiv 0 \pmod 2$ exactly when $T$ is trichromatic. But also, it's the number of purple segments on the boundary. Each purple segment in the interior of $P$ gets counted twice, and so contributes nothing, but boundary segments contribute exactly once.

Since there are an odd number of purple segments on the boundary of $P$, there are an odd number of trichromatic triangles. In particular, there's at least one of them.

(This illustrates a common trick among combinatorialists: if you want to show that an object $X$ exists, show that the number of $X$s is odd. Cheeky!)

# $2$-adic valuations

Before we describe our coloring, we'll take an unexpected detour into the land of valuations.

A **valuation** is a function that assigns a notion of "value" or "size" to numbers. There's multiple conventions, but we one we'll use is that a valuation on a ring $R$ is a function $\nu$ from $R$ to $\RR^+ \cup \{ \infty \}$ such that:
* $\nu(x) = \infty$ if and only if $x = 0$
* $\nu(xy) = \nu(x) + \nu(y)$
* $\nu(x + y) \ge \min(\nu(x), \nu(y))$

We'll assign the obvious rules to $\infty$, such as, $a + \infty = \infty$, and $\min(a, \infty) = a$.

One example of a valuation, that might help guide your intuition, is the "multiplicity of a root". For some polynomial $p(x) = a_0 + a_1 x + \cdots + a_n x^n$, let $\nu(p)$ be the index of the first non-zero coefficient. For example, $\nu(3x^4 - x^5 + 7x^8) = 4$, and $\nu(1 + x - x^2) = 0$. If all coefficients are zero, define $\nu(p) = \infty$. In essence, $\nu(p)$ is "how many" roots $p$ has at $0$; e.g., is $0$ a single root? A double root? Not a root at all?

Is this a valuation?

Well we satisfied the first property by fiat. The second one is pretty easy to see; when you multiply two polynomials, the lowest term has the sum of the degrees. And the third one ain't too bad either. If both $p$ and $q$ have zero coefficients on $x^k$, $p+q$ certainly will too. The converse isn't true though, it's possible that the low-degree terms in $p$ and $q$ could cancel, and so $\nu(p+q)$ could be larger than either $\nu(p)$ or $\nu(q)$. This is why we have an inequality, instead of an equality.

---

The particular valuation we're interested in the $2$-adic valuation, which measures how divisible by two a number is. The more factors of $2$ a number has, the bigger its valuation is.

For example, $\nu_2(2) = \nu_2(6) = \nu_2(-22) = 1$, since they all have a single factor of $2$. Odd integers have $\nu_2$ of $0$, since they have no factors of $2$ at all. And because $0$ can be factored as $2^k \cdot 0$ for any $k$, no matter how big, it makes sense to say $\nu_2(0) = \infty$.

To extend this to rational numbers, we consider $2$s in the denominator to count as negative. Consider the following examples until they make sense:
\\[ \nu_2(1/4) = -2 \qquad \nu_2(1/3) = 0 \qquad \nu_2(2/3) = 1 \qquad \nu(3/8) = -3 \qquad \nu_2(12/5) = 2 \\]

We claim this is also a valuation.

Again, we get the first property simply because we defined it to be so. The second one is also easy to verify, but the third one needs some work.

Let $x$ and $y$ be rational numbers. By pulling out all the factors of $2$ from numerator and denominator, they can be written as $x = 2^n \frac{a}{b}$ and $y = 2^m \frac{c}{d}$, where $a$, $b$, $c$, and $d$ are odd. (Note that any of these, including $n$ and $m$, may be negative.) Without loss of generality, let $n \ge m$. We'd like to show that $\nu_2(x + y)$ is at least $\min(\nu_2(x), \nu_2(y)) = m$.
\\[ x + y = 2^n \frac{a}{b} + 2^m \frac{c}{d} = 2^m \left( \frac{2^{n-m} a}{b} + \frac{c}{d} \right) = 2^m \frac{2^{n-m} ad + bc}{bd} \\]

Since $2^{n-m} ad + bc$ is an integer, and $bd$ is odd, $x + y$ has at least $m$ factors of $2$, and so $\nu_2(x + y) \ge m$, as desired. Notably, if $n$ is strictly larger than $m$, i.e., $\nu(x) > \nu(y)$, then $2^{n-m} ad + bc$ is odd, and we can guarantee that $\nu_2(x+y)$ is exactly $\nu(y)$. This is actually a property true of all valuations, so we'll state it again:
* $\nu(x + y) \ge \min(\nu(x), \nu(y))$, **and if $\nu(x) \ne \nu(y)$ this is an equality**

So $\nu_2$ is an honest-to-god valuation on $\QQ$. By a theorem of Chevalley, we can extend this to a valuation on $\RR$. The details are not particularly important, and the curious reader can find them at the end of this post.


# Coloring The Plane

Our coloring of the dissection will use the (extended) $2$-adic valuation. Our choice of coloring is peculiar enough that it deserves its own section though.

Given a point $(x,y)$ in the plane, we'll color it:
* red if $\nu_2(x) > 0$ and $\nu_2(y) > 0$
* green if $\nu_2(x) \le 0$ and $\nu_2(x) \le \nu_2(y)$
* blue if $\nu_2(y) \le 0$ and $\nu_2(y) < \nu_2(x)$

This coloring has some interesting properties, which we'll establish quickly.

Claim: if $P$ is a red point, then $Q$ and $Q-P$ have the same color.

*Proof*: This is a good exercise for the reader. Make use of the fact that, if $\nu_2(a) > 0$ and $\nu_2(x) \le 0$, then $\nu_2(x - a) \ge \min(\nu_2(x), \nu_2(a)) = \nu_2(x)$. On the other hand, if $\nu_2(x) > 0$, then $\nu_2(x - a) > 0$ as well.

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

By the previous claim, $P_g - P_r$ is green, and $P_b - P_r$ is blue. From the coloring rules, we then know that $\nu_2(y_b) < \nu_2(x_b)$ and $\nu_2(x_g) \le \nu_2(y_g)$. So $\nu_2(x_g y_b)$ is strictly less than $\nu_2(x_b y_g)$. The third property then tells us that $\nu_2(\det M) = \nu_2(x_g y_b) \le 0$. Therefore, $\det M \ne 0$, and so $P_r$, $P_g$, and $P_b$ cannot be collinear.


# Putting it Together

Now we're ready. Let $n$ be odd, and consider a dissection of the unit square into $n$ triangles of equal area.

Using the coloring rule above, we claim we get a Sperner coloring. The time we invested in the previous section pays off handsomely, as both required properties become almost trivial.
* No face of the square, nor of a triangle in the dissection, can contain vertices of all three colors, because no line *anywhere* in the plane can have vertices of all three colors!
* Again, we use the fact that there are no trichromatic lines.  Consider the corners of the square and their colors:
\\[ (0, 0) \textrm{ is red} \qquad (1, 0) \textrm{ is green} \qquad (0, 1) \textrm{ is blue} \qquad (1, 1) \textrm{ is green} \\]
<!--TODO diagram instead?-->
The only segments that could be purple lie between $(0, 0)$ and $(0, 1)$. And because one endpoint is red, and the other blue, there must be an odd number of purple segments. (Remember our exercise about deleting vertices on faces...?)

Therefore, this coloring is a Sperner coloring, and so somewhere, there is a trichromatic triangle. To finish the proof, we must show that this triangle can't have area $1/n$.

Let's revisit our second claim. Strong as it is, we can squeeze just a tiny bit more out of it. Using the same notation as before, basic coordinate geometry tells us that the area of the triangle formed by $P_r$, $P_g$, and $P_b$ is $K = \frac{1}{2} \det M$. By showing that $\det M \ne 0$, we showed that this triangle was not degenerate, i.e., the three points were not collinear. But we actually showed a little more than that; we showed that $\nu_2(\det M) \le 0$. Therefore, if a trichromatic triangle has area $K$, then $\nu_2(K) = \nu_2(\frac{1}{2} \det M) \le -1$.

But because $n$ is odd, $\nu_2(1/n) = 0$. Contradiction.


# Appendix

We promised a proof that a valuation on $\QQ$ can be extended to a valuation on $\RR$. More generally, for a field extension $L/K$, a valuation $\nu$ on $K$ can be extended to a valuation on $L$.

Unfortunately, I've got diagrams to finish making before Monday ends, so I'll amend this later ;)

<!--
*Proof*: We'll extend one element at a time. If we have a valuation on $K$, we'll extend it to a valuation on $K(\alpha)$, where $\alpha \in L$.

If $\alpha$ is transcendental over $K$, then we will write it as $t$ instead. First we extend the valuation to the polynomial ring $K[t]$, by defining $\nu(\sum_i a_i t^i)$ to be $\max(\nu(a_i))$. After that, we'll extend it to the fraction field $K(t)$ by defining $\nu(p/q) = \nu(p) / \nu(q)$, which will be a valuation for the same reason we could extend from $\ZZ$ to $\QQ$ earlier.

To show that what we defined on $K[t]$ is a valuation, let $p = \sum_i a_i t^i$ and $q = \sum_i b_i t^i$. If $\nu(p) = \max(\nu(a_i))$ is zero, then all the $\nu(a_i)$ are zero. But then all the $a_i$ must have been zero, giving $p = 0$.

Showing multiplicativity is an exercise to the reader cause I'm actually stuck on it lol TODO

If $\alpha$ is algebraic, then let $f(x) = x^n + a_{n-1} x^{n-1} + \cdots + a_1 x + a_0$ be the minimal polynomial of $\alpha$. We define
-->