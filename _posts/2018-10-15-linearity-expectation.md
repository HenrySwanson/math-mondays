---
layout: post
title: Linearity of Expectation
use_math: true
---
<div style="display: none;">
$\newcommand{\RR}{\Bbb R}$
</div>

To introduce this topic, let's start with an innocuous problem:

> You have $k$ fair, unbiased coins. If you flip all of them, what is the expected number of heads?

Your intuition should tell you that it's $k/2$. But what's really going on here is an example of a slick principle called **linearity of expectation**.

<!--more-->
---

We're not actually computing the probability of getting $0$ heads, $1$ head, $2$ heads, etc., and summing it all up, weighted by probability. Implicitly, we are making the following line of argument: the expected number of heads for one coin is $1/2$, and so the expected value for $k$ coins is $k/2$. This relies on the following claim: given two random variables $X$ and $Y$, the expected value of their sum, $E[X + Y]$, is just $E[X] + E[Y]$.

This feels intuitively true, and proving it is straightforward. Let $\Omega$ be the space of possible outcomes. Then
\begin{align\*}
E[X + Y] &= \sum_{\omega \in \Omega} p(\omega) (X + Y)(\omega) \\\\\\\\
&= \sum_{\omega \in \Omega} p(\omega) (X(\omega) + Y(\omega)) \\\\\\\\
&= \sum_{\omega \in \Omega} p(\omega) X(\omega) + \sum_{\omega \in \Omega} p(\omega) Y(\omega) \\\\\\\\
&= E[X] + E[Y]
\end{align\*}

But interestingly enough, at no point did we require $X$ and $Y$ to be independent variables. This still works even when $X$ and $Y$ are correlated! For some sanity-checking examples, consider $X = Y$ and $X = -Y$.

This principle, which is rather obvious when $X$ and $Y$ are independent (so much so that we often use it unconsciously), is unexpectedly powerful when applied to dependent variables. We'll explore the concept through several example problems.

# Number of Fixed Points

After we shuffle a deck of $n$ cards, what are the expected number of cards that have stayed in the same position? Equivalently, given an arbitrary permutation on $n$ objects, how many fixed points does it have, on average.

We have no interest in examining all $n!$ possible outcomes, and summing over the number of fixed points in each. That would be terrible. Instead, we're going to make a clever decomposition of our variable into simpler, easier to compute variables, and apply linearity of expectation.

Let $X_k$ be $1$ if tne $k$th card is in the $k$th position, and $0$ otherwise. Then we number of fixed points is $X_1 + \cdots + X_n$, and we're looking for its expected value. Clearly, the $X_k$ are not independent; if all $X_1, \ldots X_{k-1}$ are $1$, then it's impossible for $X_k = 0$. But still, we can apply linearity of expectation.

After shuffling, the $k$th card is equally likely to be in any position in the deck. So the chance of ending up in the same place is $1/n$, which makes $E[X_k] = 1/n$. But this is true for all $k$, so by linearity of expectation, $E[X_1 + \cdots + X_n] = n \cdot \frac{1}{n} = 1$. So on average, one card will stay in the same place.

# Number of Cycles

Given a random permutation on $n$ objects, how many cycles does it have?

As a reminder, the cycles of a permutation are the disjoint orbits of the objects. For example, if $\sigma$ sends $1 \to 2$, $2 \to 4$, $3 \to 6$, $4 \to 1$, $5 \to 5$, and $6 \to 3$, then the cycles of $\sigma$ are $(1, 2, 4)$, $(3, 6)$, and $(5)$.

For each $k$, let $X_k = \frac{1}{L}$, where $L$ is the length of the cycle of $\sigma$ containing $k$. So for the permutation we described, $X_1 = X_2 = X_4 = 1/3$, $X_3 = X_6 = 1/2$, and $X_5 = 1$. Then the number of cycles is $X_1 + \cdots + X_n$, since each cycle contributes $L$ copies of $1/L$. As before, it remains to compute $X_k$. Again, they're definitely not independent (either all of them equal $1/n$ or none of them do, as an example), but we can still apply linearity of expectation.

The probability that $k$ is in a cycle of length $1$ is $1/n$, since $\sigma$ would have to send $k$ to itself. $L = 1$, check. The probability it is in a cycle of length $2$ is the probability $k$ is sent to some other number, times the probability that the other number is sent back to $k$, i.e. $\frac{n-1}{n} \cdot \frac{1}{n - 1}$, which is $\frac{1}{n}$. $L = 2$, check. In general, the probability of being in a cycle of length $L$ is $\frac{n-1}{n} \frac{n-2}{n-1} \cdots \frac{n-(L-1)}{n-(L-2)} \cdot \frac{1}{n-(L-1)} = \frac{1}{n}$. Curiously, this is independent of $L$.

So the expected value of $X_k$ is the weighted sum over all possible cycle lengths: $\sum_{L=1}^n \frac{1}{n} \frac{1}{L}$. But then the expected number of cycles is $\sum_k E[X_k]$, which is just $n E[X_k] = \sum_{L = 1}^n \frac{1}{L}$. This is $H_n$, the $n$th [harmonic number](https://en.wikipedia.org/wiki/Harmonic_number).


# Gumballs

Imagine a very large gumball machine, with $n$ colors of gumballs in it, evenly distributed. We only have enough money for $k$ gumballs; what's the expected number of colors we will receive? Assume that the machine has so many gumballs that the ones we take out don't matter; effectively, we are drawing with replacement.

We have no interest in looking at how many of each color we get, only if we get the color at all. So it should at this point be unsurprising that, for each color $c$, we define $X_c$ be $1$ if we get at least one gumball of that color, and $0$ otherwise. The number of colors we get is of course the sum of the $X_c$.

The probability of *not* getting a gumball of a particular color on a particular draw is $1 - 1/n$, so the probability of not getting it in $k$ draws is $(1 - 1/n)^k$. This means that $E[X_c] = 1 - (1 - 1/n)^k$.

Thus, the expected number of colors we get is $n E[X_c] = n - n(1 - 1/n)^k$.

As a fun extension, notice that if $k$ and $n$ are equal and large, then $(1 - 1/n)^n \approx 1/e$, and so the expected number of colors is $n(1 - 1/e) \approx 0.63n$.

# Gumballs, v2

As a related problem, how many gumballs would we need to get before we have at least one of every color?

Let $T_k$ be the number of gumballs we need to draw until we have $k$ colors of gumball, assuming we have $k-1$ colors already. Then the time it takes to get all $n$ colors is $\sum_{k=1}^n T_k$.

If we have $k-1$ colors of gumball already, then the chance of drawing a new color of gumball is $p = \frac{n-k+1}{n}$ on each draw. The expected number of draws it takes to get a new color is then $\frac{1}{p} = \frac{n}{n-k+1}$.

This means that the total time to get all colors of gumball is $\frac{n}{n} + \frac{n}{n-1} + \cdots + \frac{n}{1} = n \sum_{k=1}^n \frac{1}{k} = n H_n$.

# Buffon's Needle

Consider a gigantic piece of lined paper, with the lines spaced one unit apart. If we throw a needle of length $1$ onto the paper, what is the probability it crosses a line? (This problem is often called "Buffon's needle".)

Let $X_a$ be the expected number of crossings for a needle of length $a$. Of course, we're only interested in $X_1$, and since $X_1$ is either $1$ or $0$, the expected value of $X_1$ is also the probability that the needle crosses a line. But it will be worthwhile to investigate what happens for longer and shorter needles.

Imagine painting a needle of length $a+b$, covering $a$ of it in red, and the other $b$ in blue. Then the expected number of red crossings is $E[X_a]$, and the expected number of blue crossings is $E[X_b]$, since each segment is just a smaller needle. Thus, $E[X_{a+b}] = E[X_a] + E[X_b]$, as might be expected. This tells us that $X_a$ is linear, and so it should be equal to $Ca$, for some fixed constant $C$.

Furthermore, put a sharp bend in the needle right at the color boundary, so it's shaped like an L. Each segment is still a linear needle, so the number of red crossings is still $E[X_a]$, and likewise with blue crossings. So the expected number of crossings for this bent needle is *still* $E[X_{a+b}]$, despite the kink!

By induction, if you put a finite number of sharp bends in a needle, it doesn't change the expected number of crossings. And by <s>handwaving</s> a continuity argument, this is true for continuous bends as well. So $X_a$ doesn't just measure the expected number of crossings for a needle of length $a$, but any reasonable curve of length $a$. (Much to my delight, this phenomenon is called "Buffon's noodle".) This means that if we throw a rigid noodle of length $L$ on the paper, the expected number of crossings is $CL$.

So let's consider a particular kind of noodle: a circle with diameter $1$. No matter how it's thrown onto the paper, it will cross the lines exactly twice. It has circumference $\pi$, and so we can determine that $C = \frac{2}{\pi}$. Thus, for the original needle problem, $p = X_1 = \frac{2}{\pi}$.