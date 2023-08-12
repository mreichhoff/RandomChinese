import json
import argparse
import jieba
import re


def read_dictionary(filename):
    with open(filename) as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(
        description='Get the frequency associated with each syllable, to weight how commonly they are drilled.')
    parser.add_argument(
        '--dict-filename', help='the output of cedict_parser.py, for looking up pinyin')
    parser.add_argument('-f', '--file-list', nargs='+',
                        help='The list of files to process', required=True)
    args = parser.parse_args()
    dictionary = read_dictionary(args.dict_filename)
    result = {}
    for filename in args.file_list:
        with open(filename) as f:
            for line in f:
                words = [word for word in jieba.cut_for_search(line.strip())]
                for word in words:
                    if word not in dictionary or len(dictionary[word]) == 0:
                        continue
                    # just use the first, which is allegedly the most common
                    # this would benefit from recognizing which definition is being used in the sentence,
                    # but it's not worth the effort
                    pinyin = [x.lower() for x in dictionary[word]
                              [0]['pinyin'].split(' ')]
                    for syllable in pinyin:
                        if not re.match("[a-z]+[0-9]", syllable):
                            continue
                        if syllable not in result:
                            result[syllable] = 0
                        result[syllable] += 1
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
