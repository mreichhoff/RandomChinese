import json
import argparse
import jieba
from heapq import nlargest


def read_dictionary(filename):
    with open(filename) as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(
        description='Get the frequency associated with each syllable, to weight how commonly they are drilled.')
    parser.add_argument(
        '--dict-filename', help='the output of cedict_parser.py, for looking up pinyin')
    parser.add_argument(
        '--mode', help='characters or words?')
    parser.add_argument(
        '--limit', help='only include this many words or characters')
    parser.add_argument('-f', '--file-list', nargs='+',
                        help='The list of files to process', required=True)
    args = parser.parse_args()
    dictionary = read_dictionary(args.dict_filename)
    result = {}
    for filename in args.file_list:
        with open(filename) as f:
            for line in f:
                words = [word for word in jieba.cut_for_search(
                    line.strip())] if args.mode == 'words' else line.strip()
                for word in words:
                    if word not in dictionary or (len(dictionary[word]) == 0):
                        continue
                    if word not in result:
                        result[word] = 0
                    result[word] += 1
    if args.limit:
        limited = nlargest(min(int(args.limit), len(result)),
                           result.items(), key=lambda kvp: kvp[1])
        result = {}
        for word, count in limited:
            result[word] = count
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
