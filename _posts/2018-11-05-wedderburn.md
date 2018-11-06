---
layout: post
title: Wedderburn's Little Theorem
use_math: true
---
<div style="display: none;">
$\newcommand{\ZZ}{\Bbb Z}
\newcommand{\QQ}{\Bbb Q}$
</div>

Some rings are closer to being fields than others. A **domain** is a ring where we can do cancellation: if $ab = ac$ and $a \ne 0$, then $b = c$. Even closer is a **division ring**, a ring in which every non-zero element has a multiplicative inverse. The only distinction between fields and division rings is that the latter may be non-commutative. For this reason, division rings are also called **skew-fields**.

These form a chain of containments, each of which is strict:
fields $\subset$ division rings $\subset$ domains $\subset$ rings

Some examples:
- $\ZZ$ is a domain
- $\ZZ/6\ZZ$ is not a domain
- the set of $n \times n$ matrices is not a domain; two non-zero matrices can multiply to zero
- $\QQ$ is a field (duh)
- the quaternions are a division ring

Wedderburn's theorem states that this hierarchy collapses for finite rings: every finite domain is a field.

<!--more-->
---

First, we show that every finite domain is a division ring.

Let $D$ be a finite domain, and $x \in D$ be non-zero. The map $f : D \to D$ given by $f(d) = xd$ is injective, which we get immediately from the definition of a domain. Because $D$ is finite, $f$ injective implies that $f$ is surjective as well. This means there's some $y$ such that $f(y) = xy = 1$. This makes $y$ a right-inverse of $x$; is it also a left-inverse? Yes! Since $x = 1x = xyx$, cancellation gives us $1 = yx$.

---

The next step, showing that every finite division ring is a field, is significantly trickier. We'll continue, knowing that $D$ is a division ring.

Our plan is to re-interpret $D$ as a vector space, to get some information about its size. Then, we'll drop the additive structure, and apply some group theory to the multiplicative structure. Lastly, our result will be vulnerable to some elementary number theory.

Let $Z$ be the center of $D$; the set of elements that commute multiplicatively with everything in $D$. The distributive law tells us that $Z$ is an abelian group under addition, and by definition, $Z^*$ is an abelian group under multiplication. This makes $Z$ a field, which allows us to apply some linear algebra to the problem.

As with field extensions, a division ring containing a field is a vector space over that field; specifically, $D$ is a vector space over $Z$, where vector addition is addition in $D$, and scalar multiplication is multiplication by an element of $Z$. This gives us some information about the size of $D$. If $Z$ has size $q$, and $D$ has dimension $n$ over $Z$, then $D$ has size $q^n$.

Let's look at some linear subspaces of $D$ (as a vector space). For an element $x \in D$, let $C(x)$ be the set of all elements that commute with $x$ (this is the **centralizer** of $x$). We claim that this is a subspace of $D$. It's clearly closed under addition, and we claim it is also closed under scalar multiplication. If $y \in C(x)$ and $z \in Z$, then it follows quickly that $(zy)x = x(zy)$, i.e., $zy \in C(x)$.

Because $C(x)$ is a linear subspace, it has dimension $q^k$ for some $1 \le k \le n$. And if $x \notin Z$, we know that both these inequalities are strict. If $k = n$, then $C(x) = D$, and $x$ is in fact in the center. If $k = 1$, then $C(x) = Z$, and since $x \in C(x)$ for sure, $x$ is again in $Z$.

Now we can apply some group theory. The [class equation](https://en.wikipedia.org/wiki/Conjugacy_class#Conjugacy_class_equation) is a statement about the conjugacy classes of a group. The details are best saved for another post, but if we have a group $G$ with center $Z(G)$, and $g_1, \ldots, g_r$ are distinct representatives of the non-trivial conjugacy classes, then
\\[ \|G\| = \|Z(G)\| + \sum_{i=1}^r [G : C(g_i)] \\]

Essentially, this comes from the fact that $[G : C(g_i)]$ is the number of conjugates of $g_i$, and that the conjugacy classes partition $G$.

If we apply this to $D^*$, and remember our observation about the size of $C(x)$, then we get:
\\[ q^n - 1 = (q - 1) + \sum_{i=1}^r \frac{q^n - 1}{q^{k_i} - 1}, \, 1 < k_i < n \\]

We claim that this can only happen when $n = 1$; i.e., when $Z = D$. This would prove that $D$ is a field! From here on out, it's all number theory.

---

First, we claim that each $k_i$ divides $n$. Let $n = a k_i + b$ be the result of division with remainder. Since $(q^n - 1)/(q^{k_i} - 1)$ is the index of some $C(x)$, it's an integer, so $q^{k_i} - 1$ divides $q^n - 1$, or equivalently, $q^n \equiv 1 \pmod{q^{k_i} - 1}$. Substituting $n = a k_i + b$, we get that $q^b \equiv 1 \pmod{q^{k_i} - 1}$. But since $b < k_i$, $q^b - 1 < q^{k_i} - 1$, and so we must have that $q^b - 1 = 0$; i.e., that $b = 0$. (Here, we quietly used the fact that $q > 1$.) Therefore, $k_i$ divides $n$.

For the next step, we'll need to introduce the [cyclotomic polynomials](https://en.wikipedia.org/wiki/Cyclotomic_polynomial) $\Phi_k(x)$. They have three properties in particular that are of interest to us:
- they are monic and have integer coefficients
- for any $m$, the polynomial $x^m - 1$ factors as $\prod_{k \mid m} \Phi_k(x)$
- the roots of $\Phi_k(x)$ are exactly the primitive $k$th roots of unity

The second fact tells us that $\Phi_n(x)$ is a factor of $x^n - 1$, but also, that it is a factor of $(x^n - 1)/(x^{k_i} - 1)$ -- the denominator cancels out out some of the $\Phi_k(x)$, but $\Phi_n(x)$ is left intact, since $k_i < n$.

Since the quotients $\frac{x^n - 1}{\Phi_n(x)}$ and $\frac{(x^n - 1)/(x^{k_i} - 1)}{\Phi_n(x)}$ are products of cyclotomic polynomials, each of which is monic with integer coefficients, then they are also monic with integer coefficients. Therefore, if we plug in $x = q$, we will get an integer. This means that the integer $\Phi_n(q)$ divides the integers $q^n - 1$ and $(q^n - 1)/(q^{k_i} - 1)$. Note that we had to work for this; it's not an immediate consequence of divisibility as polynomials. For example, consider $p(x) = x + 3$ snd $q(x) = x^3 + 3x^2 - x/4 - 3/4$. While $p(x)$ divides $q(x)$ as polynomials, $p(1) = 4$ does not divide $q(1) = 3$.

Now, returning to the class equation, we've shown that most of the terms are divisible by the integer $\Phi_n(q)$, so the only leftover term, $q - 1$, is also divisible by $\Phi_n(q)$. We claim this is only possible if $n = 1$, which would then give us our desired result.

Use the third fact about cyclotomic polynomials: $\Phi_n(q) = \prod (q - \zeta)$, where $\zeta$ ranges over all primitive $n$th roots of unity. Taking the modulus, we get that $\|\Phi_n(q)\| = \prod \|q - \zeta\|$. From the triangle inequality, $\|q - \zeta\| + \|\zeta\| \ge \|q\|$, or, rearranged, $\|q - \zeta\| \ge \|q\| - \|\zeta\| = q - 1$. If $n > 1$, then this inequality is strict, because equality only happens when $\zeta = 1$. Furthermore, since $q \ge 2$, we have $\|q - \zeta\| > q - 1 \ge 1$. Therefore, if $n > 1$, $\Phi_n(q)$ is a product of terms, all of which have absolute value strictly greater than $q - 1$ and $1$, thus, $\|\Phi_n(q)\| > q - 1$. But this means that $\Phi_n(q)$ cannot divide $q - 1$, and so this is a contradiction!

Therefore, $n = 1$, which forces $Z = D$, and thus $D$ to be commutative; hence, a field. Q.E.D!
