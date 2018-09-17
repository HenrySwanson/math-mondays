---
layout: post
title: Doubling Loaves, in Two Ways
use_math: true
---

This one comes from a puzzle that a coworker gave me.

There's a miracle in the Gospels in which Jesus feeds a crowd of 5000, using only a few loaves of bread and some fish. As he breaks the food apart and hands it out, it does not diminish, and eventually the entire crowd is fed.

In our puzzle, we have a prophet who is not quite so saintly. He starts with a single loaf of bread, and has to feed a crowd of $N$ people. But he also wants to be able to feed himself. Furthermore, our guy's got a bit of a gambling problem: at each step, he flips a fair, unbiased coin.
 - If it comes up heads, he duplicates one of his loaves.
 - Otherwise, he hands out a loaf of bread to someone in the crowd.

He only stops when he runs out of bread, or he creates $N$ new loaves (at which point, the entire crowd can be fed, and he can eat the original loaf).

The question is: what is the probability that he can successfully feed everyone?


---

For small values of $N$, we can manage this by hand:
 - $N = 0$: He can always feed himself, so the probability of success, $p$, is $1$. 
 - $N = 1$: Everything depends on the first coin toss. If it is heads, then he has two loaves, and can feed himself and someone else. Otherwise, he's just handed away his only loaf, and the game ends. So $p = 1/2$.
 - $N = 2$: As before, he must flip heads on the first toss. Consider the second toss. If it is heads, then he has created two loaves, plus the original, and so everyone can be fed. Otherwise, he hands out a loaf, leaving him with one loaf, and two people to feed. This reduces to the previous case, in which there is a $1/2$ chance of success. So if he makes the first toss, he has a $3/4$ chance of success, giving us $p = 3/8$ for the whole process.

Clearly, this gets tedious quickly. We need a more systematic approach.

## First Approach

One approach is to rephrase this as a problem about lattice walks.

Let the point $(x, y)$ represent the state where we have created $x$ new loaves (not counting the original loaf), and fed $y$ people (not counting himself). Then duplicating a loaf is a step to the right, and handing out a loaf is a step upward. On this grid, the prophet starts at $(0, 0)$, and randomly chooses to walk right or up. He wins if he touches the line $x = N$, and loses if he crosses the diagonal $x = y$. (Touching the diagonal is okay, at that point, he still has one loaf left.)

Let $p(a, b)$ be the probability that the prophet reaches the point $(a, b)$ on his random walk. It's only possible to reach the region $0 \le b \le a$, so we will set $p(a, b) = 0$ outside this range. Since it's our starting point, $p(0, 0)$ is clearly $1$. For all other points, we can state our probability recursively; if the prophet gets to the point $(a, b)$, then he must have come from $(a-1, b)$ or $(a, b-1)$. From either of those points, he has a $1/2$ chance of getting to $(a, b)$, so $p(a, b) = \frac{1}{2}(p(a-1, b) + p(a, b-1))$.

If you write these numbers out in a grid, you'll quickly get tired of seeing powers of $2$ in the denominator:

| $0$ |   $0$ |   $0$ |    $0$ | $7/128$ | $21/256$ | $15/256$ |
| $0$ |   $0$ |   $0$ | $5/64$ |  $7/64$ |   $7/64$ |   $3/32$ |
| $0$ |   $0$ | $1/8$ | $5/32$ |  $9/64$ |   $7/64$ |   $5/64$ |
| $0$ | $1/4$ | $1/4$ | $3/16$ |   $1/8$ |   $5/64$ |   $3/64$ |
| $1$ | $1/2$ | $1/4$ |  $1/8$ |  $1/16$ |   $1/32$ |   $1/64$ |

So we'll define an auxilary function $q(a, b) = 2^{a+b} p(a, b)$, leaving us with nice clean integers. The recurrence relation for $q$ is:
\\[ q(0, 0) = 1 \qquad q(a, b) = 0 \textrm{ if } b > a \qquad q(a, b) = q(a-1, b) + q(a, b-1) \textrm{ otherwise} \\]

| $0$ | $0$ | $0$ | $0$ | $14$ | $42$ | $90$ |
| $0$ | $0$ | $0$ | $5$ | $14$ | $28$ | $48$ |
| $0$ | $0$ | $2$ | $5$ |  $9$ | $14$ | $20$ |
| $0$ | $1$ | $2$ | $3$ |  $4$ |  $5$ |  $6$ |
| $1$ | $1$ | $1$ | $1$ |  $1$ |  $1$ |  $1$ |

This table, and the recurrence relation, feel somewhat like Pascal's triangle, with the apex in the lower left, and each counter-diagonal forming a row.

| $1$ | $5$ | $15$ | $35$ | $70$ | $126$ | $210$ |
| $1$ | $4$ | $10$ | $20$ | $35$ |  $56$ |  $84$ |
| $1$ | $3$ |  $6$ | $10$ | $15$ |  $21$ |  $28$ |
| $1$ | $2$ |  $3$ |  $4$ |  $5$ |   $6$ |   $7$ |
| $1$ | $1$ |  $1$ |  $1$ |  $1$ |   $1$ |   $1$ |

But since we're forcing the region above the diagonal to be $0$, this causes a defect. Subtracting the relevant parts of our grid from Pascal's triangle, we get:

| $-$ | $-$ | $-$ |  $-$ | $56$ | $84$ | $120$ |
| $-$ | $-$ | $-$ | $15$ | $21$ | $28$ |  $36$ |
| $-$ | $-$ | $4$ |  $5$ |  $6$ |  $7$ |   $8$ |
| $-$ | $1$ | $1$ |  $1$ |  $1$ |  $1$ |   $1$ |
| $0$ | $0$ | $0$ |  $0$ |  $0$ |  $0$ |   $0$ |

This is just a piece of Pascal's triangle, shifted by one! It appears that $q(a, b) = \binom{a+b}{b} - \binom{a+b}{b-1}$, a suspicion that is easy to confirm via the recurrence relations.

---

Now we know $q(a, b)$ in closed form, and thus $p(a, b)$ as well. But we can't just sum over $p(N, 0)$, $p(N, 1)$, ..., $p(N, N)$, because these don't correspond to disjoint events. In fact, to reach $(N, N)$ safely, the prophet must have passed through the point $(N, N-1)$ first!

We'll have to do something a little silly. Consider the counter-diagonal from $(N, N)$ to $(2N, 0)$, and note that a path can touch at most one of those points. Furthermore, if there is a path of length $2N$, and it touched the line $x = N$, then it must end on one of these points.

[comment]: TODO add a diagram here

So we'll change the rules of the game a little bit. The prophet still loses if he runs out of bread, but otherwise, he must keep flipping until the coin is flipped $2N$ times. This doesn't affect the end conditions: after the coin has been flipped $2N$ times, he's either run out of loaves, or he's flipped at least $N$ heads. And clearly, this doesn't affect his chances of success (once $N$ new loaves have been created, it is impossible to fail). But it does change where the "finish line" for our walk is. The prophet succeeds exactly when his walk ends on the counter-diagonal from $(N, N)$ to $(2N, 0)$!

This telescopes easily into a clean expression:
\\[ \sum_{k = 0}^N p(2N-k, k) = \sum_{k = 0}^N \frac{1}{2^{2N}} \left( \binom{2N}{k} - \binom{2N}{k-1} \right) = \frac{1}{2^{2N}} \binom{2N}{N} \\]

---

## Second Approach

As suggested by the title of this post, I'll also describe a second solution to this puzzle, using generating functions. Sure, this will involve some slightly heavier machinery than the previous approach, which was rather elementary, but there is a certain elegance to it.

Let $a_n$ be the probability that the prophet ended up with exactly $n$ loaves, including the original loaf. The only way to end up with exactly one loaf is to flip tails immediately, so $a_1 = 1/2$.

For $n > 1$, he must flip heads first, giving two loaves. If he ended up with exactly $n$ loaves total, he must have gotten $k$ from the first loaf, and $n-k$ from the second loaf. Since the loaves act independently, this has probability $\sum_{k=1}^{n-1} a_k a_{n-1}$. Factoring in the fact that he needs to flip heads the first time, we deduce $a_n = \frac{1}{2} \sum_{k=1}^{n-1} a_k a_{n-k}$.

If we take the bold (and intuitive!) step of defining $a_0 = 0$, we can change the bounds on that sum to be $0$ through $n$, which will make our lives easier.

Let $G(x) = a_0 + a_1 x + a_2 x^2 + \cdots$ be the generating function for $a_n$. We can tease out a very nice expression for $G(x)$:
\begin{align\*}
G(x) &= a_0 + a_1 x + \sum_{n=2}^\infty a_n x^n \\\\\\\\
&= \frac{1}{2} x + \sum_{n=2}^\infty a_n x^n \\\\\\\\
&= \frac{1}{2} x + \sum_{n=2}^\infty \left( \frac{1}{2} \sum_{k=0}^n a_k a_{n-k} \right) x^n \\\\\\\\
G(x) &= \frac{1}{2} x + \frac{1}{2} \sum_{n=2}^\infty \sum_{k=0}^n a_k a_{n-k} x^n \\\\\\\\
2 G(x) &= x + \sum_{n=2}^\infty \sum_{k=0}^n a_k a_{n-k} x^n
\end{align\*}

Since either $a_k$ or $a_{n-k}$ will be $0$ for $n < 2$, we can lower the bound on our sum to $k = 0$ without changeing anything. After that, set $\ell = n - k$:
\begin{align\*}
2 G(x) &= x + \sum_{n=0}^\infty \sum_{k=0}^n a_k a_{n-k} x^n \\\\\\\\
&= x + \sum_{k=0}^\infty \sum_{\ell=0}^\infty a_k a_\ell x^{k+\ell} \\\\\\\\
&= x + \left( \sum_{k=0}^\infty a_k x^k \right) \left( \sum_{\ell=0}^\infty a_\ell x^\ell \right) \\\\\\\\
2G(x) &= x + G(x)^2
\end{align\*}

At first blush it looks hard to isolate $G(x)$, but once we see this as the quadratic it is, we can apply the handy-dandy quadratic formula:
\\[ G(x) = \frac{2 \pm \sqrt{4 - 4x}}{2} = 1 \pm \sqrt{1 - x} \\]

Since $G(0) = a_0 = 0$, we know we should take the negative square root.

---

We could at this point find a closed-form expression for $a_n$, but that's not what we're going to do. Remember that we're not interested in the probability of getting exactly $N+1$ loaves, but the probability of getting $N+1$ or more loaves. In other words, we'd like to know $b_{N+1}$, where $b_n = 1 - \sum_{k=0}^{n-1} a_k$. [Note: we're not certain that this is the same as $\sum_{k=n}^\infty a_k$; since we haven't ruled out the possibility that this process goes on forever with positive probability. It's possible that the $a_k$ sum to $<1$.]

Let $F(x) = b_0 + b_1 x + b_2 x^2 + \cdots$ be the generating function for the $b_n$. We'll set $b_0 = 1$, since $1$ minus the empty sum should be $1$. If you're familiar with generating functions, you'll know that $F(x) = \frac{1}{1 - x} - \frac{x}{1 - x} G(x)$, but for the newcomers, we'll do it in slow motion:

To sum the terms of the series, we'll multiply by the geometric series $\frac{1}{1-x} = 1 + x + x^2 + \cdots$. The coefficient for the $x^n$ term will then be $a_0 + \cdots a_n$.
\\[ \frac{G(x)}{1 - x} = \sum_{n=0}^\infty \sum_{k=0}^n a_k x^n \\]

Multiplying by $x$ knocks our exponents up by one, equivalently, moves our coefficients down by one.
\\[ \frac{x}{1- x} G(x) = \sum_{n=0}^\infty \sum_{k=0}^{n} a_k x^{n+1} = \sum_{n=1}^\infty \sum_{k=0}^{n-1} a_k x^n \\]

Lastly, we want to subtract every coefficient (except the first) from $1$. Fortunately, we already know what $1 + x + x^2 + \cdots$ is:
\\[ \frac{1}{1 - x} - \frac{x}{1 - x}G(x) = \sum_{n=1}^\infty \left( 1 - \sum_{k=0}^{n-1} a_k \right) x^n \\]

The coefficients on the right are exactly $b_n$, so we get $F(x) = \frac{1}{1 - x} - \frac{x}{1 - x} G(x)$, as promised. This cleans up to:
\\[ F(x) = 1 + \frac{x}{\sqrt{1 - x}} \\]

Using the [generalized binomal theorem](https://en.wikipedia.org/wiki/Binomial_theorem#Newton's_generalized_binomial_theorem), we can arrive at a closed form for $b_n$.
\begin{align\*}
F(x) &= 1 + x (1 - x)^{-1/2} \\\\\\\\
&= 1 + x \sum_{n=0}^\infty \frac{(-1/2)(-3/2)\cdots(-1/2 - (n-1))}{n!} 1^{-1/2 - n} (-x)^n \\\\\\\\
&= 1 + x \sum_{n=0}^\infty \frac{(1/2)(3/2)\cdots((2n-1)/2)}{n!} x^n \\\\\\\\
&= 1 + x \sum_{n=0}^\infty \frac{(1/2) \cdot 1 \cdot (3/2) \cdot 2 \cdots ((2n-1)/2) \cdot n}{n! \cdot n!} x^n \\\\\\\\
&= 1 + x \sum_{n=0}^\infty \frac{1}{2^{2n}} \frac{1 \cdot 2 \cdot 3 \cdot 4 \cdots (2n-1) \cdot 2n}{n! \cdot n!} x^n \\\\\\\\
&= 1 + x \sum_{n=0}^\infty \frac{1}{2^{2n}} \binom{2n}{n} x^n \\\\\\\\
&= 1 + \sum_{n=0}^\infty \frac{1}{2^{2n}} \binom{2n}{n} x^{n+1}
\end{align\*}

So, the probability of getting $N+1$ or more loaves is $b_{N+1} = \frac{1}{2^{2N}} \binom{2N}{N}$, which matches the answer we got before. Thank goodness!

