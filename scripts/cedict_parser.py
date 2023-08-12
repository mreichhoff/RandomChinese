import json
import argparse


def parse_cedict_line(line, character_type):
    line = line.rstrip('/').split('/')
    english = line[1:]
    char, pinyin = line[0].split('[')
    traditional, simplified = char.split()

    return (simplified if character_type == 'simplified' else traditional, english, pinyin.rstrip().rstrip(']'))


def get_dictionary_entries(dict_filename, character_type):
    result = {}
    with open(dict_filename) as f:
        for line in f:
            if not line.startswith('#') and len(line) > 0 and len(line.rstrip('/').split('/')) > 1:
                entry = parse_cedict_line(line.strip(), character_type)
                if entry[0] not in result:
                    result[entry[0]] = []
                for definition in entry[1]:
                    if definition.startswith('variant of ') and entry[0] in definition:
                        continue
                    elif definition.startswith('surname '):
                        continue
                    elif entry[2][0].isupper():
                        continue
                    elif '(archaic)' in definition:
                        continue
                    elif 'old variant of' in definition:
                        continue
                    elif '(name)' in definition:
                        continue
                    result[entry[0]].append(
                        {'en': definition, 'pinyin': entry[2]})
    return result


def main():
    parser = argparse.ArgumentParser(
        description='Get pinyin and definitions for words. Outputs JSON.')
    parser.add_argument(
        '--dict-filename', help='the dictionary filename, currently compatible with cedict')
    parser.add_argument(
        '--character-type', help='simplified or traditional characters')

    args = parser.parse_args()

    result = get_dictionary_entries(args.dict_filename, args.character_type)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
