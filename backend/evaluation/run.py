from evaluation.dataset import SAMPLE_BENCHMARK
from evaluation.harness import BenchmarkReport, run_benchmark


def format_report(report: BenchmarkReport) -> str:
    header = (
        f"{'system':<18}{'intent':>9}{'align':>9}{'div_dist':>10}"
        f"{'P@k':>8}{'R@k':>8}{'MRR':>8}{'NDCG':>8}"
    )
    lines = [header, "-" * len(header)]
    failures: list[str] = []
    for system in report.systems:
        search = system.search
        lines.append(
            f"{system.system:<18}"
            f"{system.intentionality.mean_intent_score:>9.3f}"
            f"{system.intentionality.context_alignment:>9.3f}"
            f"{system.diversity.avg_pairwise_distance:>10.3f}"
            f"{(search.precision_at_k if search else 0.0):>8.3f}"
            f"{(search.recall_at_k if search else 0.0):>8.3f}"
            f"{(search.mrr if search else 0.0):>8.3f}"
            f"{(search.ndcg_at_k if search else 0.0):>8.3f}"
        )
        if system.error:
            failures.append(f"  {system.system}: {system.error}")
    if failures:
        lines.extend(["", "systems with errors:", *failures])
    return "\n".join(lines)


def main() -> None:
    print(format_report(run_benchmark(SAMPLE_BENCHMARK)))


if __name__ == "__main__":
    main()
